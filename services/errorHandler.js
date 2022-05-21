module.exports = errorHandler;
function errorHandler(err, _req, res, _next) {
    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        return res.status(401).json({
            status: 401,
            error: "Invalid Token"
        })
    }
    if (err.name === 'UnauthorizedRoleError') {
        // jwt authentication error
        return res.status(401).json({
            status: 401,
            error: "Invalid Role"
        })
    }
    // default to 500 server error
    return res.status(500).json({ status: 500, message: err.message });
}