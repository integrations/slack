const WebClient = require('@slack/client').WebClient;
const moment = require('moment');

const token = process.env.SLACK_API_TEST_TOKEN;
const web = new WebClient(token);

const redis = require("redis"),
    redisClient = redis.createClient();

redisClient.on("error", (err) => {
    console.log("Error " + err);
});

function arrayToFormattedString(array, key) {
  let output = '';
  if (array.length == 0) {
    return output
  } else if (array.length == 1) {
    output = array[0][key]
    return output
  } else {
    for (let i=0; i<array.length; i++) {
      if (array.length - 1 != i) {
        output += `${array[i][key]}, `
      } else {
        output += array[i][key] //last element should not have comma and space
      }
  }
  }
  return output
}

async function updateIssueMessage(messageMetaData, context) {
  // Fetch updated version of issue to retrieve accurate comment count
  const issue = await context.github.issues.get({
    owner: context.payload.issue.user.login,
    repo: context.payload.repository.name,
    number: context.payload.issue.number,
  })
  const noOfComments = issue.data.comments;

  const createdAt = moment(context.payload.issue.created_at)
  web.chat.update(messageMetaData.ts, messageMetaData.channel, '', { // 3rd argument is required in API wrapper, but not in API (We don't want to use it in this case)
    attachments: [
      {
        "color": context.payload.issue.state === "open" ? "#36a64f" : "#cb2431",
        "pretext": `[${context.payload.repository.full_name}] Issue opened by ${context.payload.issue.user.login}`,
        "fallback": `Issue opened by ${context.payload.issue.user.login}`,
        "author_name": context.payload.issue.user.login,
        "author_link": context.payload.issue.user.html_url,
        "author_icon": context.payload.issue.user.avatar_url,
        "title": `#${context.payload.issue.number} ${context.payload.issue.title}`,
        "title_link": context.payload.issue.html_url,
        "text": context.payload.issue.body, // We should truncate markdown that Slack doesn't understand.
        "fields": [
            {
                "title": "State",
                "value": context.payload.issue.state === "open" ? ":green_heart: Open" : ":heart: Closed",
                "short": true
            },
            {
                "title": "Labels",
                "value": arrayToFormattedString(context.payload.issue.labels, 'name'),
                "short": true
            },
            {
                "title": "Assignees",
                "value": arrayToFormattedString(context.payload.issue.assignees, 'login'),
                "short": true
            },
            {
                "title": "Comments",
                "value": `<${context.payload.issue.html_url}|:speech_balloon: ${noOfComments}>`,
                "short": true
            },
        ],
        "footer": `<${context.payload.issue.html_url}|View it on GitHub>`,
        "footer_icon": "https://assets-cdn.github.com/favicon.ico",
        "ts": createdAt.unix(),
        "mrkdwn_in": ["pretext", "text", "fields"]
      }
    ]
  },function(err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
      messageMetaData = {
        channel: res.channel,
        ts: res.ts,
      }
      redisClient.set(context.payload.issue.id, JSON.stringify(messageMetaData), redis.print)
    }
  });
}

function retrieveStoredMetadata(id) {
  return new Promise((resolve, reject) => {
    redisClient.get(id, (err, value) => {
      if (err) {
        reject(new Error(err));
      } else if (!value) {
        reject(new Error(`Could not find the supplied id in the database: Value is ${value}`));
      } else {
        resolve(value);
      }
    });
  })
}

module.exports = (robot) => {
  robot.on('issues.opened', async context => {

    const createdAt = moment(context.payload.issue.created_at);
    web.chat.postMessage('#general', '', { // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
      attachments: [
        {
          "color": context.payload.issue.state === "open" ? "#36a64f" : "#cb2431",
          "pretext": `[${context.payload.repository.full_name}] Issue opened by ${context.payload.issue.user.login}`,
          "fallback": `Issue opened by ${context.payload.issue.user.login}`,
          "author_name": context.payload.issue.user.login,
          "author_link": context.payload.issue.user.html_url,
          "author_icon": context.payload.issue.user.avatar_url,
          "title": `#${context.payload.issue.number} ${context.payload.issue.title}`,
          "title_link": context.payload.issue.html_url,
          "text": context.payload.issue.body, // We should truncate markdown that Slack doesn't understand.
          "fields": [
              {
                  "title": "State",
                  "value": context.payload.issue.state === "open" ? ":green_heart: Open" : ":red_heart: Closed",
                  "short": true
              },
              {
                  "title": "Labels",
                  "value": arrayToFormattedString(context.payload.issue.labels, 'name'),
                  "short": true
              },
              {
                  "title": "Assignees",
                  "value": arrayToFormattedString(context.payload.issue.assignees, 'login'),
                  "short": true
              },
              {
                  "title": "Comments",
                  "value": `<${context.payload.issue.comments_url}|:speech_balloon: ${context.payload.issue.comments}>`,
                  "short": true
              },
          ],
          "footer": `<${context.payload.issue.html_url}|View it on GitHub>`,
          "footer_icon": "https://assets-cdn.github.com/favicon.ico",
          "ts": createdAt.unix(),
          "mrkdwn_in": ["pretext", "text", "fields"]
        }
      ]
    },function(err, res) {
      if (err) {
        console.log('Error:', err);
      } else {
        console.log('Message sent: ', res);
        messageMetaData = {
          channel: res.channel,
          ts: res.ts,
        }
        redisClient.set(context.payload.issue.id, JSON.stringify(messageMetaData), redis.print)
      }
    });
  });

  robot.on('issues.labeled', matchMetaDataStatetoIssueMessage);
  robot.on('issues.unlabeled', matchMetaDataStatetoIssueMessage);
  robot.on('issues.assigned', matchMetaDataStatetoIssueMessage);
  robot.on('issues.unassigned', matchMetaDataStatetoIssueMessage);
  robot.on('issue_comment', matchMetaDataStatetoIssueMessage);

  async function matchMetaDataStatetoIssueMessage(context) {

    // Fetch updated version of issue to retrieve accurate comment count
    const issue = await context.github.issues.get({
      owner: context.payload.issue.user.login,
      repo: context.payload.repository.name,
      number: context.payload.issue.number,
    })
    const noOfComments = issue.data.comments;


    const id = context.payload.issue.id
    storedMetaData = await retrieveStoredMetadata(id);
    const messageMetaData = JSON.parse(storedMetaData);
    updateIssueMessage(messageMetaData, context);
  };

  robot.on('issues.closed', async context => {
    // New message that says Issue was closed
    // Update existing message
    // should use Issue close red
    // One-off "event" message never gets updated
    const closedAt = moment(context.payload.issue.closed_at)
    web.chat.postMessage('#general', '', { // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
      attachments: [
        {
          "color": "#cb2431",
          "pretext": `[${context.payload.repository.full_name}] Issue closed by ${context.payload.sender.login}`,
          "fallback": `Issue closed by ${context.payload.sender.login}`,
          "title": `#${context.payload.issue.number} ${context.payload.issue.title}`,
          "title_link": context.payload.issue.html_url,
          "footer": `<${context.payload.issue.html_url}|View it on GitHub>`,
          "footer_icon": "https://assets-cdn.github.com/favicon.ico",
          "ts": closedAt.unix(),
          "mrkdwn_in": ["pretext", "text", "fields"]
        }
      ]
    },function(err, res) {
      if (err) {
        console.log('Error:', err);
      } else {
        console.log('Message sent: ', res);
      }
    });

    const id = context.payload.issue.id
    storedMetaData = await retrieveStoredMetadata(id);
    const messageMetaData = JSON.parse(storedMetaData);
    updateIssueMessage(messageMetaData, context);
  });

  robot.on('issues.reopened', async context => {
    const updatedAt = moment(context.payload.issue.updated_at)
    web.chat.postMessage('#general', '', { // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
      attachments: [
        {
          "color": "#36a64f",
          "pretext": `[${context.payload.repository.full_name}] Issue reopened by ${context.payload.sender.login}`,
          "fallback": `Issue reopened by ${context.payload.sender.login}`,
          "title": `#${context.payload.issue.number} ${context.payload.issue.title}`,
          "title_link": context.payload.issue.html_url,
          "footer": `<${context.payload.issue.html_url}|View it on GitHub>`,
          "footer_icon": "https://assets-cdn.github.com/favicon.ico",
          "ts": updatedAt.unix(),
          "mrkdwn_in": ["pretext", "text", "fields"]
        }
      ]
    },function(err, res) {
      if (err) {
        console.log('Error:', err);
      } else {
        console.log('Message sent: ', res);
      }
    });

    const id = context.payload.issue.id
    storedMetaData = await retrieveStoredMetadata(id);
    const messageMetaData = JSON.parse(storedMetaData);
    updateIssueMessage(messageMetaData, context);
  });
};
