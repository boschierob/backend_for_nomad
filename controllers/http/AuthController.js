const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Validator } = require('node-input-validator');
// const { prisma } = require('../../services/database');
const { PrismaClient } = require(process.cwd() + '/node_modules/.prisma/client-auth');
const prismaAuth = new PrismaClient();
const passport = require('../../services/passport');

// Register: création d'un utilisateur local
const register = async (req, res) => {
  const v = new Validator(req.body, {
    email: 'required|email',
    password: 'required|minLength:5',
  });
  const matched = await v.check();
  if (!matched) {
    return res.status(422).json({ status: 422, error: v.errors });
  }
  const userExists = await prismaAuth.user.findFirst({ where: { email: req.body.email } });
  if (userExists) {
    return res.status(409).json({ status: 409, message: "Email already exists!" });
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = await prismaAuth.user.create({
    data: {
      email: req.body.email,
      encrypted_password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  const { encrypted_password, ...userWithoutHash } = user;
  return res.status(201).json({ status: 201, data: userWithoutHash });
};

// Login: authentification locale, retourne un JWT
const login = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ status: 401, error: info ? info.message : 'Login failed' });
    }
    const token = jwt.sign(
      { identity: user.email, role: user.role },
      process.env.APP_JWT,
      { expiresIn: '7d' }
    );
    const { encrypted_password, ...userWithoutHash } = user;
    return res.status(200).json({
      status: 200,
      data: {
        user: userWithoutHash,
        token: token
      }
    });
  })(req, res, next);
};

// Google callback: génère un JWT pour l'utilisateur Google
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ status: 401, error: info ? info.message : 'Google login failed' });
    }
    const token = jwt.sign(
      { identity: user.email, role: user.role },
      process.env.APP_JWT,
      { expiresIn: '7d' }
    );
    // Redirige vers le frontend avec le token dans l'URL
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : 'http://localhost:8080';
    return res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  })(req, res, next);
};

// Profile: retourne les infos de l'utilisateur authentifié (JWT)
const profile = (req, res) => {
  // req.user est injecté par passport-jwt
  if (!req.user) {
    return res.status(401).json({ status: 401, error: 'Unauthorized' });
  }
  const { encrypted_password, ...userWithoutHash } = req.user;
  return res.status(200).json({ status: 200, data: userWithoutHash });
};

// Logout (stateless)
const logout = (req, res) => {
  return res.status(200).json({ status: 200, message: "Logged out. Please delete your token client-side." });
};

module.exports = {
  register,
  login,
  googleCallback,
  profile,
  logout,
};
