const User = require('../models/User');

const authenticate = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  req.user = req.session.user;
  next();
};

const authenticateSocket = (socket, next) => {
  const session = socket.request.session;
  if (!session || !session.user) {
    return next(new Error('Authentication error'));
  }
  socket.user = session.user;
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authenticateSocket,
  requireRole
};