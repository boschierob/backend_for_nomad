const Home = require('../controllers/http/HomeController.js')
const Auth = require('../controllers/http/AuthController.js')
const authorisation = require('../middleware/authorisation');


module.exports = (app) => {

  app.get('/', Home.getAll);
  app.get('/secure', Home.secure);

  /*--- AUTH ---*/
  app.post('/auth/login', Auth.login);
  app.post('/auth/register', Auth.register);
  app.post('/auth/forgetpassword', Auth.forgetPassword);
  app.post('/auth/reset', Auth.resetPassword);
  app.put('/auth/update', authorisation, Auth.updateUser);
  app.post('/auth/logout', Auth.logout);

  /*--- AUTH ---*/

}
