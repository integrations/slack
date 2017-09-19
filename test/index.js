const expect = require('expect')
const request = require('supertest')
const createServer = require('../lib/server')

describe('server', function () {
  let server
  let webhook

  beforeEach(() => {
    server = createServer(webhook)

    // Error handler to avoid printing logs
    server.use(function (err, req, res, next) {
      res.status(500).send(err.message)
    })
  })

  describe('POST /slack/', () => {
    it('returns a 200 repsonse', () => {
      const token = process.env.OLD_MODEL_SLACK_SECRET_TOKEN;
      
      return request(server).post('/slack/').expect(200)
        .expect('Content-Type', 'application/json')
        .then(response => {
          expect(response.body).toEqual({})
        });
    })
  })

})
