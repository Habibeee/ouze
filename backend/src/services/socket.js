// src/services/socket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    try {
      // Token via handshake.auth.token (recommandé) ou query.token (fallback)
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        socket.disconnect(true);
        return;
      }
      const decoded = jwt.verify(token.replace(/^Bearer\s+/i, ''), process.env.JWT_SECRET);
      const room = `${decoded.userType}:${decoded.id}`;
      socket.join(room);

      socket.emit('socket:ready', { room });
    } catch (e) {
      socket.disconnect(true);
    }
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };
