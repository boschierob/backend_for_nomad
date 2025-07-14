const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Récupère le token dans l'en-tête Authorization : "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 401, error: 'No token provided' });
  }

  try {
    // Vérifie et décode le token
    const decoded = jwt.verify(token, process.env.APP_JWT);
    // Ajoute les infos du token à la requête pour les routes suivantes
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ status: 403, error: 'Invalid or expired token' });
  }
};
