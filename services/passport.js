const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { prisma } = require('./database');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile:', profile);

      // Vérifie la présence d'un email
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      // Cherche l'utilisateur par email
      let user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        // Crée un nouvel utilisateur Google
        const newUser = await prisma.user.create({
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
        user = newUser;
      }
      console.log('User found/created:', user);
      return done(null, user);
    } catch (err) {
      console.error('Error in GoogleStrategy:', err);
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;