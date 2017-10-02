module.exports = (config) => (req, res, next) => {
    // inject config
    req.config = config;
    return next();
};