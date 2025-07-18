const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const { prisma } = require('./database');

// Stratégie locale (email/mot de passe)
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findFirst({ where: { email } });
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
      const user = await prisma.user.findFirst({ where: { email: jwtPayload.identity } });
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
      console.log('Google profile:', profile);

      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      if (!email) {
        console.error('No email found in Google profile');
        return done(new Error('No email found in Google profile'), null);
      }

      // Recherche de l'utilisateur dans le schéma public
      let user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            encrypted_password: null,
            raw_user_meta_data: {
              google_id: profile.id,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value
            },
            created_at: new Date().toISOString(),
            // Création du profil lié
            profile: {
              create: {
                bio: profile.displayName || null,
                avatarurl: profile.photos?.[0]?.value || null,
                // Ajoute d'autres champs si besoin
              }
            }
          },
          include: { profile: true } // Pour retourner aussi le profil créé
        });
        console.log('Nouvel utilisateur Google + profil créés:', user);
      } else {
        // Mise à jour du profil existant
        await prisma.profile.update({
          where: { userId: user.id },
          data: {
            bio: profile.displayName || null,
            avatarurl: profile.photos?.[0]?.value || null,
          }
        });
        // (Optionnel) Récupère le profil mis à jour pour le retourner
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: { profile: true }
        });
      }

      return done(null, user);
    } catch (err) {
      console.error('Erreur stratégie Google:', err);
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