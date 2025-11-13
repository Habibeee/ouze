// Simple in-memory user storage
// En production, remplacer par une vraie base de données (MongoDB, PostgreSQL, etc.)

const users = new Map();

export function findUserByEmail(email) {
  return users.get(email.toLowerCase());
}

export function createUser(email, userData) {
  users.set(email.toLowerCase(), {
    ...userData,
    email: email.toLowerCase()
  });
  return users.get(email.toLowerCase());
}

export function userExists(email) {
  return users.has(email.toLowerCase());
}

export function getAllUsers() {
  return Array.from(users.values());
}

export function deleteUser(email) {
  return users.delete(email.toLowerCase());
}
