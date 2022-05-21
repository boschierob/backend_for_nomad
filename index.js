const app = require('express')();
const cors = require('cors')
const server = require('http').createServer(app);
const dotenv = require('dotenv').config()
const io = require('socket.io')(server, {cors: {origin: '*'}});
const jwt = require('./services/jwt');
const errorHandler = require('./services/errorHandler');
const port = process.env.APP_PORT || 3000;
var bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());
app.use(jwt(app));

const route = require('./routes/http')(app)
const socket = require('./routes/WebSocket')(io)

app.use(errorHandler);

server.listen(port, () => {
  console.log(`App running on ${port}`)
});
