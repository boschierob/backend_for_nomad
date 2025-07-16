module.exports = function requireAdmin(req, res, next) {
  // express-jwt place le payload décodé dans req.user
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ status: 403, error: 'Admin access required' });
}; 