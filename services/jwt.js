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
  }, 1000)
  const APP_JWT = process.env.APP_JWT;
  return jwt({ secret: APP_JWT, algorithms: ['HS256'], isRevoked }).unless({
    path: unlessPath
  });
}

async function isRevoked(req, payload) {
  for (const key in protectedRoot[req.url]) {
    if (payload.payload.role.includes(protectedRoot[req.url][key])) {
      throw new UnauthorizedRoleError()
    }
  } 
}

class UnauthorizedRoleError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedRoleError";
  }
}

