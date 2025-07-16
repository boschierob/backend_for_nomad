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

const allowedOrigins = [
  'http://localhost:5173', // Dev Vite
  'http://localhost:8080', // Dev React classique
  process.env.FRONTEND_URL // Prod (Netlify, etc.)
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Autorise les requêtes sans origin (ex: Postman) ou si l'origine est dans la whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    // domain: à ajouter si besoin (ex: .ton-domaine.com)
  }
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