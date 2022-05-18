module.exports = errorHandler;
function errorHandler(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        return res.status(401).json({
            status: 401,
            error: "Invalid Token"
        })
    }
    // default to 500 server error
    return res.status(500).json({ status: 500, message: err.message });
}