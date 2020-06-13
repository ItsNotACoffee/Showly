exports.get404 = (req, res, next) => {
    res.status(404).render('404', { 
        title: 'Page Not Found - Showly', 
        path: '/404' 
    });
};

exports.get500 = (req, res, next) => {
    res.status(500).render('500', { 
        title: 'A server-side error occured - Showly', 
        path: '/500' 
    });
};