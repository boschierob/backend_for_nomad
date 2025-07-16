const app = require('express')();
const cors = require('cors');
const server = require('http').createServer(app);
require('dotenv').config();
const io = require('socket.io')(server, {cors: {origin: '*'}});
const jwt = require('./services/jwt');
const errorHandler = require('./services/errorHandler');
const port = process.env.APP_PORT || 3000;
var bodyParser = require('body-parser');

const session = require('express-session');
const passport = require('./services/passport');

app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Debug: log session et user à chaque requête
app.use((req, res, next) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  next();
});

app.get('/test-session', (req, res) => {
  res.json({ user: req.user, session: req.session });
});

// app.use(jwt(app)); // Désactivé temporairement pour debug

const route = require('./routes/http')(app);
const socket = require('./routes/WebSocket')(io);

app.use(errorHandler);

server.listen(port, () => {
  console.log(`App running on ${port}`);
}); 