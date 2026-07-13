const crypto = require('crypto');

const DEFAULT_SECRET = process.env.JWT_SECRET || 'truck-rental-dev-secret';

function parseBearerToken(req) {
  const authHeader = req.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice('Bearer '.length).trim();
}

function createAuthToken(payload, secret = DEFAULT_SECRET) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyAuthToken(token, secret = DEFAULT_SECRET) {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  if (expected !== signature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch (error) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const token = parseBearerToken(req);
  const headerUserId = req.get('x-user-id');
  const headerRole = req.get('x-user-role') || 'customer';

  if (token) {
    const decoded = verifyAuthToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (headerUserId) {
    req.user = {
      id: headerUserId,
      role: headerRole,
      provider: 'header'
    };
    return next();
  }

  if (process.env.AUTH_REQUIRED === 'true') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = {
    id: 'anonymous',
    role: 'anonymous',
    provider: 'anonymous'
  };
  next();
}

function requireAuth(req, res, next) {
  if (!req.user || req.user.role === 'anonymous') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || req.user.role === 'anonymous') {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  requireAuth,
  requireRole,
  createAuthToken,
  verifyAuthToken
};
