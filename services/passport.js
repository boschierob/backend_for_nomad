const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const { PrismaClient } = require(process.cwd() + '/node_modules/.prisma/client-auth');
const prismaAuth = new PrismaClient();

// Stratégie locale (email/mot de passe)
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await prismaAuth.user.findFirst({ where: { email } });
      if (!user || !user.encrypted_password) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      const isMatch = await bcrypt.compare(password, user.encrypted_password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Stratégie JWT
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.APP_JWT,
  }, async (jwtPayload, done) => {
    try {
      // Utilise findFirst au lieu de findUnique pour l'email
      const user = await prismaAuth.user.findFirst({ where: { email: jwtPayload.identity } });
      if (!user) {
        console.error('Utilisateur non trouvé pour le JWT:', jwtPayload.identity);
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      console.error('Erreur dans la stratégie JWT:', err);
      return done(err, false);
    }
  }
));

// Stratégie Google
const isProd = process.env.NODE_ENV === 'production';
const callbackUrl =
  process.env.GOOGLE_CALLBACK_URL ||
  (!isProd && 'http://localhost:5000/auth/google/callback');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackUrl,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      if (!email) return done(new Error('No email found in Google profile'), null);
      let user = await prismaAuth.user.findFirst({ where: { email } });
      if (!user) {
        user = await prismaAuth.user.create({
          data: {
            email,
            encrypted_password: null,
            raw_user_meta_data: {
              google_id: profile.id,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value
            },
            created_at: new Date().toISOString()
          }
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prismaAuth.user.findUnique({ where: { id } });
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;