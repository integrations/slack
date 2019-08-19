const { Op } = require('sequelize');
const { labelValuePattern, parseFeatures, mergeLabelsAndFeatures } = require('../settings-helper');

module.exports = (sequelize, DataTypes) => {
  // Map GitHub event names to the names used for settings
  const EventNameToSettings = {
    pull_request: 'pulls',
    status: 'statuses',
    check_run: 'statuses',
    deployment_status: 'deployments',
    push: 'commits',
    issue_comment: 'comments',
    commit_comment: 'comments',
    create: 'branches',
    delete: 'branches',
    pull_request_review: 'reviews',
    pull_request_review_comment: 'comments',
    release: 'releases',
  };

  const DefaultSettings = {
    issues: true,
    pulls: true,
    deployments: true,
    statuses: true,
    public: true,
    commits: true,
    releases: true,
    comments: false,
    branches: false,
    reviews: false,
    label: [],
  };

  const FixedSettings = {
    repository: true,
  };

  const AllowValues = {
    commits: ['all'],
    label: labelValuePattern(),
  };

  function validValuesMessage() {
    const quotedFeatures = Object.keys(DefaultSettings).map(feature => `\`${feature}\``);
    const featureString = quotedFeatures.join(', ');

    return ['Available features are:', featureString].join('\n');
  }

  // This indirection allows us to add abstractions like name transformations etc later
  function isValidFeatureName(name) {
    return DefaultSettings[name] !== undefined;
  }

  function invalidInputFailure(message) {
    throw Error(`${message}. ${validValuesMessage()}`);
  }

  function invalidFeatureNameFailure(feature) {
    invalidInputFailure(`\`${feature}\` is not a feature`);
  }

  function invalidFeatureValueFailure(key, value) {
    invalidInputFailure(`\`${key}:${value}\` is not a valid feature/value pair`);
  }

  function validateSingle(key, value) {
    if (typeof value === 'boolean') {
      return true;
    }
    const spec = AllowValues[key];

    if (spec === undefined) {
      return false;
    }

    // support static lists of valid values
    if (Array.isArray(spec) && spec.includes(value)) {
      return true;
    }

    // support single value string matches
    if (spec instanceof RegExp && spec.test(value)) {
      const matchResult = spec.test(value);
      return matchResult;
    }

    // always return false if the case is unknown
    return false;
  }

  function validateAll(key, inputArray) {
    return inputArray.every(inputVal => validateSingle(key, inputVal));
  }

  function isValidFeatureValue(key, value) {
    // NOTE: we want to store a collection of values
    // thus we validate each entry.
    if (Array.isArray(DefaultSettings[key])) {
      if (!Array.isArray(value)) {
        // no type magic today
        return false;
      }
      return validateAll(key, value);
    }
    return validateSingle(key, value);
  }

  const Subscription = sequelize.define('Subscription', {
    githubId: DataTypes.BIGINT,
    // Storing only for debugging purposes. Do not use for querying data since it might change
    githubName: DataTypes.STRING,
    channelId: DataTypes.STRING,
    type: DataTypes.STRING,
    settings: {
      type: DataTypes.JSON,

      // implicitly called by:
      // * Subscription(attrs) // receives parser output
      // * Subscription.create(attrs) // receives processed parser output
      // TODO consider logging all invocations of this setter  in production to estimate it's need
      set(values) {
        Object.assign(this.settings, values);
        this.changed('settings', true);
      },

      get() {
        if (!this.getDataValue('settings')) {
          this.setDataValue('settings', {});
        }
        return this.getDataValue('settings');
      },

      validate: {
        validateSetting(settingInput) {
          Object.keys(settingInput).forEach((settingName) => {
            if (!isValidFeatureName(settingName)) {
              invalidFeatureNameFailure(settingName);
            }

            const settingValue = settingInput[settingName];
            if (!isValidFeatureValue(settingName, settingValue)) {
              invalidFeatureValueFailure(settingName, settingValue);
            }
          });
        },
      },
    },
  });

  Subscription.hook('afterDestroy', async (subscription) => {
    await sequelize.model('DeletedSubscription').create(subscription.dataValues);
  });

  Subscription.associate = (models) => {
    Subscription.SlackWorkspace = Subscription.belongsTo(models.SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
    });
    Subscription.Installation = Subscription.belongsTo(models.Installation, {
      foreignKey: 'installationId',
      allowNull: false,
    });
    Subscription.Creator = Subscription.belongsTo(models.SlackUser, {
      foreignKey: 'creatorId',
      allowNull: true,
    });
  };

  Object.assign(Subscription.prototype, {
    cacheKey(...parts) {
      return [`channel#${this.slackWorkspaceId}#${this.channelId}`].concat(parts).join(':');
    },

    isEnabledForGitHubEvent(event) {
      const key = EventNameToSettings[event] || event;
      const settings = Object.assign({}, DefaultSettings, this.settings, FixedSettings);
      return !!settings[key];
    },

    // private API for re-use across create/update
    enableFeatures(features) {
      if (features.length === 0) {
        return;
      }

      Object.entries(features).forEach(([name, value]) => {
        // handle list of values. E.g. label: ['wip', 'DO NOT MERGE']
        if (Array.isArray(DefaultSettings[name])) {
          // ignore empty collections
          if (!value.length) {
            return;
          }
          // initialize array if necessary to ensure proper types
          if (!Array.isArray(this.settings[name])) {
            this.settings[name] = [];
          }

          // TODO: consider concat or something ...
          this.settings[name] = this.settings[name].concat(value);
          // TODO: make this cleaner. Create a union from the start?
          this.settings[name] = [...new Set(this.settings[name])];
        } else {
          this.settings[name] = value;
        }
      });
      this.changed('settings', true);
    },

    // visibility: public
    // `Update` existing subscriptions
    enable(settings) {
      // expect object of parsed settings
      if (settings) {
        // TODO: Do we want to handle settings.invalids here?
        const features = parseFeatures(settings.features, true);
        const mergedSettings = mergeLabelsAndFeatures(settings.labels, features);
        this.enableFeatures(mergedSettings);
      }
    },

    getEnabledSettings() {
      const settings = Object.assign({}, DefaultSettings, this.settings);
      return Object.keys(settings)
        .map((setting) => {
          if (settings[setting] === true) {
            return setting;
          } else if (Array.isArray(settings[setting]) && settings[setting].length === 0) {
            // If array type setting has no element, it is considered as disabled
            return null;
          } else if (Array.isArray(settings[setting]) && settings[setting].length) {
            const asString = settings[setting].map(x => `'${x}'`).join(', ');
            // handle array settings like list of labels
            return `${setting}: [${asString}]`;
          } else if (settings[setting]) {
            // handle key:value settings like commits:all
            return `${setting}:${settings[setting]}`;
          }
          return null;
        })
        .filter(setting => setting);
    },

    getEnabledSettingString() {
      return this.getEnabledSettings.map(setting => `\`${setting}\``).join(', ');
    },

    disableFeatures(features) {
      if (this.settings === undefined) {
        return;
      }
      Object.entries(features).forEach(([name, value]) => {
        // handle list of values. E.g. label: ['wip', 'DO NOT MERGE']
        if (Array.isArray(DefaultSettings[name])) {
          // initialize array if necessary to ensure proper types
          // remove from array
          const currentSettings = new Set(this.settings[name] || []);
          const unwantedSettings = new Set(value);
          const newSettings = new Set([...currentSettings].filter(x => !unwantedSettings.has(x)));

          if (newSettings.size === 0) {
            delete this.settings[name];
          } else {
            this.settings[name] = Array.from(newSettings);
          }
        } else {
          // are there non boolean cases to consider? defaults to restore, etc?
          this.settings[name] = false;
        }
      });
      this.changed('settings', true);
    },

    // visibility public
    // update the subscription by disabling a set of features
    disable(settings) {
      if (settings) {
        const features = parseFeatures(settings.features, false);
        const mergedSettings = mergeLabelsAndFeatures(settings.labels, features);
        // TODO special-case label without argument as: disable all labels?
        this.disableFeatures(mergedSettings);
      }
    },

    async updateGithubName(githubName) {
      if (githubName && this.githubName !== githubName) {
        await this.update({ githubName });
      }
    },

    async destroyWithReason(reason) {
      await this.destroy();
      await sequelize.model('DeletedSubscription').update({ reason }, { where: { id: this.id } });
    },
  });

  Object.assign(Subscription, {
    async lookup(githubId) {
      return this.findAll({
        where: { githubId },
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    async lookupAll(query) {
      return this.findAll({
        where: {
          [Op.or]: query,
        },
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    async lookupOne(githubId, channelId, slackWorkspaceId) {
      return this.findOne({
        where: { githubId, channelId, slackWorkspaceId },
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    // `Create` subscription
    async subscribe(attrs) {
      if (!attrs.creatorId) {
        // Effectively enforcing not-null constaint at app level
        throw Error('Need to pass creatorId for new subscriptions');
      }

      // TODO replace mutation by helper function
      let record;
      const { settings, ...subscription } = attrs;
      if (settings) {
        const features = parseFeatures(settings.features, true);
        const mergedSettings = mergeLabelsAndFeatures(settings.labels, features);
        // this.enableFeatures(mergedSettings);
        // attrs.settings = mergedSettings;
        const data = Object.assign(subscription, { settings: mergedSettings });
        record = await this.create(data);
      } else {
        record = await this.create(subscription);
      }
      return record.reload({ include: [Subscription.SlackWorkspace, Subscription.Installation] });
    },

    // Delete the entire subscription
    async unsubscribe(githubId, channelId, slackWorkspaceId) {
      const where = { githubId, channelId, slackWorkspaceId };
      const subscriptions = await this.findAll({ where });
      await this.destroy({ where, individualHooks: true });

      const ids = subscriptions.map(subscription => subscription.id);
      await sequelize
        .model('DeletedSubscription')
        .update({ reason: 'unsubscribe' }, { where: { id: ids } });
    },

    groupByChannel(subscriptions) {
      return subscriptions.reduce((byChannel, subscription) => {
        if (!byChannel[subscription.channelId]) {
          // eslint-disable-next-line no-param-reassign
          byChannel[subscription.channelId] = [];
        }

        byChannel[subscription.channelId].push(subscription);

        return byChannel;
      }, {});
    },

    async destroyByCreatorId(creatorId) {
      const { Installation } = sequelize.models;
      const subscriptions = await this.findAll({
        where: { creatorId },
        include: [Installation],
      });
      await this.destroy({
        where: { creatorId },
        individualHooks: true,
      });
      const ids = subscriptions.map(subscription => subscription.id);
      await sequelize
        .model('DeletedSubscription')
        .update({ reason: 'signout' }, { where: { id: ids } });
      return subscriptions;
    },
  });

  return Subscription;
};
