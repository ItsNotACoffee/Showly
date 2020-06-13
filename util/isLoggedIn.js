module.exports = (req, res, next) => {
    //redirect if not logged in
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};