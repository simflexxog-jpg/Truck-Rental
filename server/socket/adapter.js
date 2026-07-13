const { logger } = require('../logger');

function attachSocketAdapter(io) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info('Socket.IO Redis adapter disabled', { reason: 'REDIS_URL not configured' });
    return null;
  }

  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        logger.info('Socket.IO Redis adapter enabled');
      })
      .catch((error) => {
        logger.warn('Socket.IO Redis adapter unavailable', { error: error.message });
      });

    return { pubClient, subClient };
  } catch (error) {
    logger.warn('Socket.IO Redis adapter unavailable', { error: error.message });
    return null;
  }
}

module.exports = { attachSocketAdapter };
