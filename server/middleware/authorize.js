const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = authorize;
