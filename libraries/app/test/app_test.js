const assert = require('assert');
const App = require('../');
const request = require('superagent');
const express = require('express');
const isUUID = require('is-uuid');
const testing = require('taskcluster-lib-testing');

suite(testing.suiteName(), function() {

  // Test app creation
  suite('app({port: 1459})', function() {
    let server;

    suiteSetup(async function() {
      // this library expects an "api" to have an express method that sets it up..
      const fakeApi = {
        express(app) {
          const router = express.Router();
          router.get('/test', function(req, res) {
            res.status(200).send('Okay this works');
          });
          router.get('/req-id', function(req, res) {
            res.status(200).send(JSON.stringify({
              header: req.headers['x-request-id'],
              valueSet: req.requestId,
            }));
          });
          app.use('/api/test/v1', router);
        },
      };

      // Create a simple app
      server = await App({
        port: 1459,
        env: 'development',
        forceSSL: false,
        forceHSTS: true,
        trustProxy: false,
        apis: [fakeApi],
      });
    });

    test('get /test', async function() {
      const res = await request.get('http://localhost:1459/api/test/v1/test');
      assert(res.ok, 'Got response');
      assert.equal(res.text, 'Okay this works', 'Got the right text');
    });

    test('hsts header', async function() {
      const res = await request.get('http://localhost:1459/api/test/v1/test');
      assert.equal(res.headers['strict-transport-security'], 'max-age=7776000000; includeSubDomains');
    });

    test('request ids', async function() {
      const res = await request
        .get('http://localhost:1459/api/test/v1/req-id')
        .buffer();
      const body = JSON.parse(res.text);
      assert(isUUID.v4(res.headers['x-for-request-id']));
      assert(!isUUID.v4(body.header));
      assert(isUUID.v4(body.valueSet));
    });

    test('request ids (heroku)', async function() {
      const res = await request
        .get('http://localhost:1459/api/test/v1/req-id')
        .set('X-Request-Id', 'TestingRequestId')
        .buffer();
      const body = JSON.parse(res.text);
      assert.equal(res.headers['x-for-request-id'], 'TestingRequestId');
      assert.equal(body.header, 'TestingRequestId');
      assert.equal(body.valueSet, 'TestingRequestId');
    });

    test('/robots.txt', async function() {
      const res = await request.get('http://localhost:1459/robots.txt');
      assert(res.ok, 'Got response');
      assert.equal(res.text, 'User-Agent: *\nDisallow: /\n', 'Got the right text');
      assert.equal(res.headers['content-type'], 'text/plain; charset=utf-8');
    });

    test('/not-found', async function() {
      try {
        await request.get('http://localhost:1459/api/test/v1/notfound');
      } catch (err) {
        assert.equal(err.status, 404, 'Status code is 404');
        assert.equal(err.response.body.error, 'Not found', 'Response message is correct');
        assert.equal(err.response.headers['content-type'], 'application/json; charset=utf-8',
          'Correct content-type is set to headers');
        assert.equal(
          err.response.headers['content-security-policy'],
          'report-uri /__cspreport__;default-src \'none\';frame-ancestors \'none\';',
          'Correct CSP is set in headers');
        return;
      }
      throw new Error('expected exception not seen');
    });

    suiteTeardown(function() {
      return server.terminate();
    });
  });
});
