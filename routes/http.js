const Home = require('../controllers/http/HomeController.js')
const Auth = require('../controllers/http/AuthController.js')
const authorisation = require('../middleware/authorisation');
const DbTest = require('../controllers/http/DbTestController.js');
const UserManagement = require('../controllers/http/UserManagementController.js');
const requireAdmin = require('../middleware/requireAdmin');
const passport = require('../services/passport');
const jwt = require('jsonwebtoken');
const { prisma } = require('../services/database');


module.exports = (app) => {

  app.get('/', Home.getAll);
  app.get('/secure', Home.secure);

  // Test DB connection
  app.get('/db-test', DbTest.testDbConnection);

  /*--- AUTH ---*/
  app.post('/auth/login', Auth.login);
  app.post('/auth/register', Auth.register);
  app.post('/auth/forgetpassword', Auth.forgetPassword);
  app.post('/auth/reset', Auth.resetPassword);
  app.put('/auth/update', authorisation, Auth.updateUser);
  app.post('/auth/logout', Auth.logout);

  // Auth Google
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      console.log('req.user in callback:', req.user); // Ajoute ce log
      if (!req.user) {
        return res.status(401).json({ status: 401, error: "Invalid Token" });
      }
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email, name: req.user.name },
        process.env.APP_JWT,
        { expiresIn: '7d' }
      );
      // Redirection dynamique selon l'environnement
      const frontendUrl = process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:8080';
      res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }
  );

  // User Management (admin only)
  app.get('/users', requireAdmin, UserManagement.getAllUsers);
  app.get('/users/:id', requireAdmin, UserManagement.getUserById);
  app.post('/users', requireAdmin, UserManagement.createUser);
  app.put('/users/:id', requireAdmin, UserManagement.updateUser);
  app.delete('/users/:id', requireAdmin, UserManagement.deleteUser);

  // Route protégée pour récupérer l'utilisateur courant à partir du JWT
  app.get('/me', authorisation, async (req, res) => {
    try {
      // req.user.id est injecté par le middleware authorisation (décodage du JWT)
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get('/admin/only', requireAdmin, (req, res) => {
    res.json({ message: 'Bienvenue, admin !' });
  });

  app.get('/test-session', (req, res) => {
    res.json({ user: req.user, session: req.session });
  });

  /*--- AUTH ---*/

}
