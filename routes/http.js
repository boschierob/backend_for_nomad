const home = require('../controllers/http/HomeController.js')


module.exports = (app) => {

  app.get('/', home.getAll);

}
