const testing = require('taskcluster-lib-testing');
const SchemaSet = require('taskcluster-lib-validate');
const {defaultMonitorManager} = require('taskcluster-lib-monitor');
const assert = require('assert');
const path = require('path');
const express = require('express');

let runningServer = null;

const rootUrl = 'http://localhost:23525';
exports.rootUrl = rootUrl;

suiteSetup('set up monitorManager', async function() {
  exports.monitorManager = defaultMonitorManager.configure({
    serviceName: 'lib-api',
  });
  exports.monitor = exports.monitorManager.setup({
    fake: true,
    debug: true,
    verify: true,
    level: 'debug',
  });
});

teardown(function() {
  exports.monitorManager.reset();
});

/**
 * Set up a testing server on port 23525 serving the given API.
 */
exports.setupServer = async ({builder, context}) => {
  testing.fakeauth.start({
    'client-with-aa-bb-dd': ['aa', 'bb', 'dd'],
  }, {rootUrl});
  assert(runningServer === null);

  const schemaset = new SchemaSet({
    serviceName: 'test',
    folder: path.join(__dirname, 'schemas'),
  });

  const api = await builder.build({
    rootUrl,
    schemaset,
    monitor: exports.monitor,
    context,
  });

  // Create application
  const app = express();
  api.express(app);

  return await new Promise(function(accept, reject) {
    const server = app.listen(23525);
    server.once('listening', function() {
      runningServer = server;
      accept(server);
    });
    server.once('error', reject);
  });
};

exports.teardownServer = async () => {
  if (runningServer) {
    await new Promise(function(accept) {
      runningServer.once('close', function() {
        runningServer = null;
        accept();
      });
      runningServer.close();
    });
  }
  testing.fakeauth.stop();
};
