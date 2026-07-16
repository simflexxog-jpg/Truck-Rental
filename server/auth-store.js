const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data');
const storePath = path.join(dataDir, 'auth-users.json');

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify([], null, 2));
  }
}

function readUsers() {
  ensureStore();
  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  ensureStore();
  fs.writeFileSync(storePath, JSON.stringify(users, null, 2));
}

function hashText(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createUser(user) {
  const users = readUsers();
  users.push(user);
  writeUsers(users);
  return user;
}

function findUserByEmail(email) {
  const users = readUsers();
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function updateUser(id, patch) {
  const users = readUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    return null;
  }
  users[index] = { ...users[index], ...patch };
  writeUsers(users);
  return users[index];
}

function findUserByRefreshToken(token) {
  const users = readUsers();
  const tokenHash = hashText(token);
  return users.find((user) => user.refreshTokenHash === tokenHash) || null;
}

function setRefreshToken(userId, token) {
  const hash = hashText(token);
  return updateUser(userId, { refreshTokenHash: hash });
}

function clearRefreshToken(userId) {
  return updateUser(userId, { refreshTokenHash: null });
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserByRefreshToken,
  setRefreshToken,
  clearRefreshToken,
  updateUser,
  readUsers,
  hashText
};
