const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

function applySecurityMiddleware(app) {
  app.set('trust proxy', 1);
  app.use(helmet());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use(limiter);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
}

module.exports = { applySecurityMiddleware };
