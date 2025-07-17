const Home = require('../controllers/http/HomeController.js');
const Auth = require('../controllers/http/AuthController.js');
const passport = require('../services/passport');

module.exports = (app) => {
  app.get('/', Home.getAll);
  app.get('/secure', Home.secure);

  // Auth routes (JWT stateless)
  app.post('/auth/register', Auth.register);
  app.post('/auth/login', Auth.login);
  app.post('/auth/logout', Auth.logout);

  // Auth Google
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );
  app.get('/auth/google/callback', Auth.googleCallback);

  // Profile (JWT protected)
  app.get('/auth/profile', passport.authenticate('jwt', { session: false }), Auth.profile);
};
