const connection = require('../controllers/websocket/ConnectionController.js')

module.exports = (io) => {

  io.on('connection', connection.connect)
  io.on('disconnect', connection.disconnect)

}
