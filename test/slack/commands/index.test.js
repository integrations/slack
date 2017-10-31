process.env.SLACK_VERIFICATION_TOKEN = 'test'

const request = require('supertest')
const express = require('express')
const slack = require('../../../lib/slack')
const createProbot = require('probot')

describe('commands', () => {
  let probot

  beforeEach(() => {
    probot = createProbot({})
    probot.load(slack)
  })

  // TODO: verifies token
  describe('/subscribe owner/repo', () => {
    const command = {
      // Slack will POST with:
      token: process.env.SLACK_VERIFICATION_TOKEN,
      team_id: 'T0001',
      team_domain: 'example',
      enterprise_id: 'E0001',
      enterprise_name: 'Globular%20Construct%20Inc',
      channel_id: 'C2147483705',
      channel_name: 'test',
      user_id: 'U2147483697',
      user_name: 'Steve',
      command: '/weather',
      text: '94070',
      response_url: 'https://hooks.slack.com/commands/1234/5678',
      trigger_id: '13345224609.738474920.8088930838d88f008e0',
    }

    test('status 200', () => {
      return request(probot.server).post('/slack/command')
        .send(command)
        .expect(200, 'OK')
    })
  });
});
