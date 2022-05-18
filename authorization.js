export default function permit(...permittedRoles) {
  // return a middleware
  return (request, response, next) => {
    const { user } = request
    const apiToken = request.headers['x-api-token'];
    // request.user = await request.db.users.findByApiKey(apiToken);

    if (user && permittedRoles.includes(user.role)) {
      next(); // role is allowed, so continue on the next middleware
    } else {
      response.status(403).json({message: "Forbidden"}); // user is forbidden
    }
  }
}
