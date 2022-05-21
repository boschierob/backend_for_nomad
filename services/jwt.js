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

