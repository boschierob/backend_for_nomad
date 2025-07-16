const { expressjwt: jwt } = require('express-jwt');

module.exports = jwtF;
let expressApp = undefined
let unlessPath = []
const protectedRoot = require('./../routes/protected.json');

function jwtF(app) {
  expressApp = app
  setTimeout(() => {
    for (const key in expressApp._router.stack) {
      if (expressApp._router.stack[key].route) {
        if (!Object.keys(protectedRoot).includes(expressApp._router.stack[key].route.path)) {
          unlessPath.push(expressApp._router.stack[key].route.path)
        }
      }
    }
  }, 1000);

  const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
  const APP_JWT = process.env.APP_JWT;

  if (!SUPABASE_JWT_SECRET && !APP_JWT) {
    throw new Error('Neither SUPABASE_JWT_SECRET nor APP_JWT is defined in environment variables');
  }

  // Fonction de récupération du secret selon le token
  const getSecret = (req, token) => {
    console.log('JWT middleware called for:', req.path);
    // On tente d'abord avec le secret Supabase
    if (SUPABASE_JWT_SECRET) return SUPABASE_JWT_SECRET;
    // Sinon, on utilise le secret local
    return APP_JWT;
  };

  return jwt({
    secret: getSecret,
    algorithms: ['HS256'],
    isRevoked
  }).unless({
    path: [
      '/users',
      /^\/users\/.*/,
      '/auth/login',
      '/auth/register',
      '/auth/forgetpassword',
      '/auth/reset',
      '/db-test',
      /^\/auth\/.*/,
      ...unlessPath
    ]
  });
}

async function isRevoked(req, payload) {
  let isIn = false
  const urlCall = req.url.replace('/', '').split('/')
  for (const key in protectedRoot) {
    if (Object.keys(protectedRoot[key]).includes(req.method)) {
      const splitUrl = key.split(':')
      if (splitUrl.length > 1) {
        const baseUrls = { url: splitUrl[0].replace(/\//g, ''), params: splitUrl.length - 1 }
        if ((urlCall[0] === baseUrls.url) && (baseUrls.params == urlCall.length - 1)) {
          if (payload.payload.role.some(item => protectedRoot[key][req.method].includes(item))) {
            isIn = true
          }
        }
      } else {
        if (payload.payload.role.some(item => protectedRoot[key][req.method].includes(item))) {
          isIn = true
        }
      }
    }
  }
  if (!isIn) {
    throw new UnauthorizedRoleError()
  }
}

class UnauthorizedRoleError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedRoleError";
  }
}

