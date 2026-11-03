const express = require('express');
const apiRoutes = require('../../src/routes/api');

function createTestApp() {
  const app = express();
  app.use(express.json());

  // Mock Socket.io instance so controller events don't throw
  app.set('io', {
    emit: () => {}
  });

  app.use('/api', apiRoutes);
  return app;
}

function startTestServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done))
      });
    });
  });
}

module.exports = {
  createTestApp,
  startTestServer
};
