const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const errorController = require('./controllers/error');
const db = require('./util/database');
const session = require('express-session');
const sessionHandler = require('express-mysql-session')(session);
const multer = require('multer');
const crypto = require('crypto');
const flash = require('connect-flash');

const app = express();

//view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

//body parser
app.use(bodyParser.urlencoded({extended: false}));

//static serving
app.use(express.static(path.join(__dirname, 'style')));
app.use('/images', express.static(path.join(__dirname, 'images')));

//session
var sessionStore = new sessionHandler({}, db);

app.use(session({secret: `${process.env.SESSION_SECRET}`, store: sessionStore, resave: false,  saveUninitialized: false}));

//flash
app.use(flash());

//file handling
const fileFilter = (req, file, cb) => { //prevent other image/non-image formats
    if (file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        crypto.randomBytes(16, (err, buffer) => {
            if (err) {
                console.log(err);
            }
            var extension = '.' + file.mimetype.split('/')[1];
            var rand = buffer.toString('hex');
            cb(null, req.session.userId + '_' + rand + extension);
        });
    }
})
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));

//locals
app.use((req, res, next) => {
    //search
    res.locals.lastQuery = '';
    res.locals.lastType = '';
    res.locals.lastPage = '';
    res.locals.errorType = '';

    //misc
    res.locals.token = '';

    //authentication
    res.locals.loggedIn = req.session.userId != null ? true : false;

    //watchlist
    res.locals.lastSort = '';
    res.locals.sortDir = '';
    next();
});

//routes
const mainRoutes = require('./routes/main.js');
const showRoutes = require('./routes/shows.js');
const watchlistRoutes = require('./routes/watchlist.js');
const miscRoutes = require('./routes/misc');

app.use(mainRoutes);
app.use('/shows', showRoutes);
app.use(watchlistRoutes);
app.use(miscRoutes);
app.use('/500', errorController.get500);
app.use(errorController.get404);

//error handler
app.use((error, req, res, next) => {
    console.log(error);
    res.redirect('/500');
})

//server
app.listen(process.env.PORT || 3000);