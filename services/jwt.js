const { expressjwt: jwt } = require('express-jwt');

module.exports = jwtF;

function jwtF() {
  const APP_JWT = process.env.APP_JWT || "LOCAL-secret";

  return jwt({ secret: APP_JWT, algorithms: ['HS256'] }).unless({
    path: [
      '/',
      '/auth/register',
      '/auth/login',
      '/auth/forgetpassword',
      '/auth/reset',
    ]
  });
}

