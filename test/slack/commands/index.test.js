process.env.SLACK_VERIFICATION_TOKEN = 'test'

const request = require('supertest')
const express = require('express')
const slack = require('../../../lib/slack')
const createProbot = require('probot')

describe('commands', () => {
  let probot

  beforeEach(() => {
    probot = createProbot({})
  })

  describe('/github subscribe https://github.com/owner/repo', () => {
    test('status 200', () => {
      const command = require('../../fixtures/slack/command.subscribe')

      return request(probot.server).post('/slack/command')
        .send(command)
        .expect(200, 'OK')
    })
  });
});
