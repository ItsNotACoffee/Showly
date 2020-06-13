module.exports = (req, res, next) => {
    //reset anti-tamper
    if (req.session.storedId != null) {
        req.session.storedId = null;
    }
    next();
};