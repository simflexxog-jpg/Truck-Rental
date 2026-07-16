const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { createUser, findUserByEmail, updateUser, findUserByRefreshToken, setRefreshToken, clearRefreshToken, readUsers } = require('../auth-store');

const JWT_SECRET = process.env.JWT_SECRET || 'truck-rental-dev-secret';
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 15;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['customer', 'partner', 'driver']),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  companyName: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  emergencyContact: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

function createToken(payload, expiresIn) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getZodErrorMessage(error) {
  if (!error) {
    return 'Invalid input';
  }
  if (Array.isArray(error.issues) && error.issues.length > 0) {
    return error.issues[0]?.message || 'Invalid input';
  }
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0]?.message || 'Invalid input';
  }
  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return 'Invalid input';
}

function sendMail(templateName, to, data) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });

  const templatePath = path.join(__dirname, '..', 'emails', templateName);
  let html = fs.readFileSync(templatePath, 'utf8');
  Object.entries(data).forEach(([key, value]) => {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@renta.local',
    to,
    subject: templateName === 'verification.html' ? 'Verify your Renta account' : 'Reset your Renta password',
    html
  });
}

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const existing = findUserByEmail(parsed.email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (parsed.role === 'driver' && !parsed.licenseNumber) {
      return res.status(400).json({ error: 'licenseNumber is required for drivers' });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 12);
    const verificationToken = createToken({ email: parsed.email, purpose: 'verify-email' }, '24h');
    createUser({
      id: `user_${Date.now()}`,
      email: parsed.email,
      passwordHash,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      role: parsed.role,
      phoneNumber: parsed.phoneNumber,
      companyName: parsed.companyName || '',
      licenseNumber: parsed.licenseNumber || '',
      licenseExpiry: parsed.licenseExpiry || '',
      emergencyContact: parsed.emergencyContact || '',
      emailVerified: false,
      failedAttempts: 0,
      lockUntil: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      refreshTokenHash: null,
      verificationToken,
      resetToken: null,
      resetTokenExpiresAt: null,
      permissions: parsed.role === 'driver' ? ['drive'] : []
    });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-email?token=${verificationToken}`;
    try {
      await sendMail('verification.html', parsed.email, { verificationUrl });
    } catch (mailError) {
      console.warn('Email delivery failed, continuing with registration:', mailError?.message || mailError);
    }

    res.status(201).json({ message: 'Check your email to verify your account' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: getZodErrorMessage(error) });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const user = findUserByEmail(parsed.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email' });
    }
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      return res.status(423).json({ error: `Account locked until ${user.lockUntil}` });
    }

    const valid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!valid) {
      const nextFailedAttempts = (user.failedAttempts || 0) + 1;
      updateUser(user.id, {
        failedAttempts: nextFailedAttempts,
        lockUntil: nextFailedAttempts >= 5 ? new Date(Date.now() + 1000 * 60 * 15).toISOString() : null
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const rememberMe = Boolean(parsed.rememberMe);
    const accessToken = createToken({ sub: user.id, role: user.role, email: user.email }, rememberMe ? '7d' : '1h');
    const refreshToken = createOpaqueToken();
    setRefreshToken(user.id, refreshToken);
    updateUser(user.id, {
      failedAttempts: 0,
      lockUntil: null,
      lastLoginAt: new Date().toISOString()
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_TTL_MS
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyName || null,
        permissions: user.permissions || [],
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: getZodErrorMessage(error) });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: 'Missing refresh token' });
  }
  const user = findUserByRefreshToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  const accessToken = createToken({ sub: user.id, role: user.role, email: user.email }, '1h');
  res.json({ accessToken });
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    const user = findUserByRefreshToken(token);
    if (user) {
      clearRefreshToken(user.id);
    }
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

router.post('/forgot-password', async (req, res) => {
  const email = req.body?.email;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const user = findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const resetToken = createToken({ email, purpose: 'reset-password' }, '15m');
  updateUser(user.id, {
    resetToken,
    resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()
  });
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${resetToken}`;
  await sendMail('reset-password.html', email, { resetUrl });
  res.json({ message: 'Password reset email sent' });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.purpose !== 'reset-password') {
      return res.status(400).json({ error: 'Invalid token' });
    }
    const user = readUsers().find((entry) => entry.resetToken === token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    updateUser(user.id, {
      passwordHash: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
      refreshTokenHash: null,
      failedAttempts: 0,
      lockUntil: null
    });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

router.get('/verify-email', async (req, res) => {
  const token = req.query?.token;
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.purpose !== 'verify-email') {
      return res.status(400).json({ error: 'Invalid token' });
    }
    const user = readUsers().find((entry) => entry.verificationToken === token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    updateUser(user.id, { emailVerified: true, verificationToken: null });
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
