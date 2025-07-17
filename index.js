const app = require('express')();
const cors = require('cors');
const server = require('http').createServer(app);
require('dotenv').config();
const io = require('socket.io')(server, {cors: {origin: '*'}});
const jwt = require('./services/jwt');
const errorHandler = require('./services/errorHandler');
const port = process.env.APP_PORT || 3000;
var bodyParser = require('body-parser');

// SUPPRIME express-session
// const session = require('express-session');
const passport = require('./services/passport');

const allowedOrigins = [
  'http://localhost:5173', // Dev Vite
  'http://localhost:8080', // Dev React classique
  process.env.FRONTEND_URL // Prod (Netlify, etc.)
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
// SUPPRIME app.use(session(...))
app.use(passport.initialize());
// SUPPRIME app.use(passport.session());

// SUPPRIME logs session/user et la route /test-session
// app.use((req, res, next) => {
//   console.log('Session:', req.session);
//   console.log('User:', req.user);
//   next();
// });
// app.get('/test-session', (req, res) => {
//   res.json({ user: req.user, session: req.session });
// });

// app.use(jwt(app)); // Désactivé temporairement pour debug

const route = require('./routes/http')(app);
const socket = require('./routes/WebSocket')(io);

app.use(errorHandler);

server.listen(port, () => {
  console.log(`App running on ${port}`);
}); 