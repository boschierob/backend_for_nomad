const app = require('express')();
const cors = require('cors')
const server = require('http').createServer(app);
const dotenv = require('dotenv').config()
const io = require('socket.io')(server, {cors: {origin: '*'}});
const port = process.env.APP_PORT || 3000;
var bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.json());

const route = require('./routes/http')(app)
const socket = require('./routes/WebSocket')(io)

server.listen(port, () => {
  console.log(`App running on ${port}`)
});
