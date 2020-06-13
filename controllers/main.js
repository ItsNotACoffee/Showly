const db = require('../util/database');
const bcrypt = require('bcryptjs');
const mailer = require('../util/mailer');
const crypto = require('crypto');
const User = require('../models/user');
const Entry = require('../models/entry');
const EntrySeason = require('../models/entry_season');
const moment = require('moment');

//get
exports.getIndex = (req, res, next) => {
    if (req.session && req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.render('index', {
            path: '/',
            title: 'Showly'
        });
    }
};

exports.getLogin = (req, res, next) => {
    if (req.session && req.session.userId) {
        res.redirect('/dashboard');
    } else {
        let message = req.session.flash ? req.flash('message') : null,
            msgType = 0;

        if (message && message.length > 0) {
            msgType = message[0].split('=')[1];
            message = message[0].split('=')[0];
        }

        res.render('auth/login', {
            path: '/login',
            title: 'Login - Showly',
            message: message,
            messageType: msgType
        });
    }
};

exports.getRegister = (req, res, next) => {
    if (req.session && req.session.userId) {
        res.redirect('/dashboard');
    } else {
        let message = req.session.flash ? req.flash('message') : null,
            msgType = 0;

        if (message && message.length > 0) {
            msgType = message[0].split('=')[1];
            message = message[0].split('=')[0];
        }

        res.render('auth/register', {
            path: '/register',
            title: 'Register - Showly',
            email: '',
            message: message,
            messageType: msgType
        });
    }
};

exports.getConfirm = (req, res, next) => {
    let token = req.query.token;

    db.execute('SELECT * FROM user WHERE token = ?', [token])
        .then(([user]) => {
            if (user.length < 1) { //if token doesn't exist
                req.flash('message', 'Invalid or expired token!=1');
                res.status(422).redirect('/login');
            } else {
                let date = new Date();
                let time = date.getTime();
                if (time > user[0].token_exp) { //if token expired
                    req.flash('message', 'Invalid or expired token!=1');
                    res.status(422).redirect('/login');
                } else {
                    let oldUser = user[0];
                    let updatedUser = new User(oldUser.name, oldUser.surname, oldUser.email, oldUser.password, null, null, 1, null, null, null, null);
                    return updatedUser.save()
                        .then(() => {
                            req.flash('message', 'Email confirmed, you may log in!=2');
                            res.status(200).redirect('/login');
                        });
                }
            }
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getReset = (req, res, next) => {
    let message = req.session.flash ? req.flash('message') : null,
        msgType = 0,
        token = null;

    if (message && message.length > 0) {
        message = message[0];
        if (message.includes('token=')) {
            token = message.split('/')[1].split('=')[1];
            msgType = message.split('/')[0].split('=')[1];
            message = message.split('/')[0].split('=')[0];
        } else {
            msgType = message.split('=')[1];
            message = message.split('=')[0];
        }
    }
    if (token == null && req.query.token) { //set token to query param if not set by flash
        token = req.query.token;
    }

    if (token != null) {
        db.execute('SELECT * FROM user WHERE token = ?', [token])
            .then(([user]) => {
                if (user.length < 1) { //if token doesn't exist
                    req.flash('message', 'Invalid or expired token!=1');
                    res.redirect('/login');
                } else {
                    let date = new Date();
                    let time = date.getTime();
                    if (time > user[0].token_exp) { //if token expired
                        req.flash('message', 'Invalid or expired token!=1');
                        res.redirect('/login');
                    } else {
                        res.locals.token = token;
                        res.render('auth/reset', {
                            path: '/reset',
                            title: 'Reset Password',
                            message: message,
                            messageType: msgType
                        });
                    }
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    } else {
        res.render('auth/reset', {
            path: '/reset',
            title: 'Reset Password - Showly',
            message: message,
            messageType: msgType
        });
    }
};

exports.getDashboard = (req, res, next) => {
    var userId = req.session.userId;

    Entry.getAllByUserId(userId, [1, 2, 3, 4])
        .then(([shows]) => {
            //set status chart data
            var watchlistChart = [],
                completed = 0,
                watching = 0,
                planToWatch = 0,
                dropped = 0,
                total = 0;

            for (let show of shows) {
                if (show.status == 1) {
                    completed++;
                } else if (show.status == 2) {
                    watching++;
                } else if (show.status == 3) {
                    planToWatch++;
                } else if (show.status == 4) {
                    dropped++;
                }
                total++;
            }
            watchlistChart.push(completed, watching, planToWatch, dropped, total);

            //set top list data and general stats
            var ratings = [],
                totalShows = 0, //only look at completed shows
                daysWatched = 0,
                genres = [],
                watchingArray = [],
                planToArray = [],
                droppedArray = [];
            shows.sort((a, b) => (b.rating > a.rating) ? 1 : -1);
            for (let show of shows) {
                if (show.rating != null) {
                    ratings.push({ 'name': show.name, 'rating': show.rating });
                }
                if (show.status == 1) {
                    totalShows++;

                    var start = show.startDate ? moment(show.startDate, "DD.MM.YYYY") : null;
                    var end = show.endDate ? moment(show.endDate, "DD.MM.YYYY") : null;

                    if (start != null && end != null) { //take into consideration only if both dates specified
                        var diff = end.diff(start, 'days') + 1;
                        daysWatched += diff;
                    }
                }

                if (show.status == 2) {
                    watchingArray.push(show);
                } else if (show.status == 3) {
                    planToArray.push(show);
                } else if (show.status == 4) {
                    droppedArray.push(show);
                }

                if (show.tags.includes(',')) { //if multiple tags
                    var tags = show.tags.trim().split(',');
                    for (var i = 0; i < tags.length; i++) {
                        var tagName = tags[i].split(" ").join("");
                        if (genres.length < 1) { //if list empty
                            genres.push({ 'genre': tagName, 'amount': 1 });
                        } else {
                            var found = false;
                            for (let genre of genres) {
                                if (genre.genre == tagName) {
                                    genre.amount = genre.amount + 1;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                genres.push({ 'genre': tagName, 'amount': 1 });
                            }
                        }
                    }
                } else { //if single tag
                    var tagName = show.tags.trim().split(" ").join("");
                    if (genres.length < 1) { //if list empty
                        genres.push({ 'genre': tagName, 'amount': 1 });
                    } else {
                        var found = false;
                        for (let genre of genres) {
                            if (genre.genre == tagName) {
                                genre.amount = genre.amount + 1;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            genres.push({ 'genre': tagName, 'amount': 1 });
                        }
                    }
                }
            }

            //set list arrays
            //watching
            var indexes = [];
            var watchingLength = watchingArray.length,
                actualLength = watchingArray.length < 4 ? watchingArray.length : 4;
            while (indexes.length < actualLength) { //generate random indexes from 0 to either 4 or watching length
                var r = Math.floor(Math.random() * watchingLength);
                if (indexes.indexOf(r) === -1) indexes.push(r);
            }

            var newWatchingArray = [];
            for (var i = 0; i < indexes.length; i++) {
                var index = indexes[i];
                newWatchingArray.push(watchingArray[index]);
            }

            //plan to
            indexes = [];
            var planToLength = planToArray.length,
                actualLength = planToArray.length < 4 ? planToArray.length : 4;
            while (indexes.length < actualLength) { //generate random indexes from 0 to either 4 or watching length
                var r = Math.floor(Math.random() * planToLength);
                if (indexes.indexOf(r) === -1) indexes.push(r);
            }

            var newPlanToArray = [];
            for (var i = 0; i < indexes.length; i++) {
                var index = indexes[i];
                newPlanToArray.push(planToArray[index]);
            }

            EntrySeason.getAllByUserId(userId)
                .then(([seasons]) => {
                    var generalStats = {},
                        totalEps = 0;

                    for (let season of seasons) {
                        if (season.status == 1) {
                            totalEps += season.episode;
                        }
                    }

                    generalStats['totalShows'] = totalShows;
                    generalStats['totalEps'] = totalEps;
                    generalStats['daysWatched'] = daysWatched;
                    generalStats['genres'] = genres;

                    //fetch user profile pic
                    User.getUserById(userId)
                        .then(([user]) => {
                            var age = null,
                                birthday = user[0].birthday != null ? user[0].birthday : null;

                            if (birthday != null) { //calculate age
                                var endDate = moment().toDate(),
                                    end = moment(endDate, "DD.MM.YYYY");

                                var age = end.diff(birthday, 'years');
                            }
                            user[0]["age"] = age;

                            res.render('dashboard', {
                                path: '/dashboard',
                                title: 'Dashboard - Showly',
                                wlChart: watchlistChart,
                                ratings: ratings, //array of objects {name, rating}
                                generalStats: generalStats, //object with properties
                                watching: newWatchingArray,
                                planto: newPlanToArray,
                                user: user.length > 0 ? user[0] : null
                            });
                        })
                        .catch((err) => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                })
                .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

//post
exports.postRegister = (req, res, next) => {
    let email = req.body.email,
        password = req.body.password,
        repeatPassword = req.body.repeatPassword;

    if (email == null || email == '' || password == null || password == '' ||
        repeatPassword == null || repeatPassword == '') {
        req.flash('message', 'Email and/or password cannot be empty!=1');
        res.redirect('/register');
    } else {
        db.execute('SELECT 1 FROM user WHERE user.email = ?', [email])
            .then(([emailch]) => { //email check
                if (emailch.length > 0) {
                    req.flash('message', 'User with that email already exists!=1');
                    res.redirect('/register');
                } else {
                    if (password != repeatPassword) { //password check
                        req.flash('message', 'Passwords are not identical!=1');
                        res.redirect('/register');
                    } else if (password.length > 150 || repeatPassword.length > 150 || email.length > 150) {
                        req.flash('message', 'Email/password cannot be longer than 150 chars!=1');
                        res.redirect('/register');
                    } else { //insert
                        bcrypt.hash(password, 12, (err, hash) => {
                            if (!err) {
                                crypto.randomBytes(32, (err, buffer) => {
                                    if (err) {
                                        console.log(err);
                                        return res.redirect('/');
                                    }

                                    let token = buffer.toString('hex');
                                    let date = new Date();
                                    let token_exp = date.getTime() + 86400000; //token valid for 1 day since generation

                                    let user = new User(null, null, email, hash, token, token_exp, 0, null, null, null, null);
                                    user.save()
                                        .then(() => {
                                            req.flash('message', 'User successfully created, check your email!=2');
                                            res.redirect('/login');
                                            return mailer.sendVerificationEmail(email, token, 'register');
                                        })
                                        .catch((err) => {
                                            const error = new Error(err);
                                            error.httpStatusCode = 500;
                                            return next(error);
                                        });
                                })
                            } else {
                                throw new Error(err);
                            }
                        })
                    }
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};

exports.postLogin = (req, res, next) => {
    let email = req.body.email,
        password = req.body.password;

    if (email == null || email == '' || password == null || password == '') {
        req.flash('message', 'Email and/or password cannot be empty!=1');
        res.redirect('/login');
    } else {
        User.getUserByEmail(email)
            .then(([user]) => {
                if (user.length > 0) {
                    bcrypt.compare(password, user[0].password)
                        .then((valid) => {
                            if (valid) {
                                if (user[0].verified == 1) { //login
                                    req.session.userId = user[0].userId;
                                    res.redirect('/');
                                } else { //not verified
                                    req.flash('message', 'You have not verified your email yet!=1');
                                    res.redirect('/login');
                                }
                            }
                            else { //not a valid password
                                req.flash('message', 'Wrong password!=1');
                                res.redirect('/login');
                            }
                        })
                        .catch((err) => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                } else { //user not found
                    req.flash('message', 'This user does not exist!=1');
                    res.redirect('/login');
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};

exports.postSignout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
};

exports.postReset = (req, res, next) => {
    let email = req.body.email;

    User.getUserByEmail(email)
        .then(([user]) => {
            if (user.length < 1) { //not found
                req.flash('message', 'This user does not exist!=1');
                res.redirect('/reset');
            } else {
                if (user[0].verified == 0) { //not verified
                    req.flash('message', 'This user is not verified yet!=1');
                    res.redirect('/reset');
                } else {
                    crypto.randomBytes(32, (err, buffer) => {
                        if (err) {
                            throw new Error(err);
                        }

                        let oldUser = user[0];
                        let token = buffer.toString('hex');
                        let date = new Date();
                        let token_exp = date.getTime() + 86400000; //token valid for 1 day since generation

                        let newUser = new User(oldUser.name, oldUser.surname, oldUser.email, oldUser.password, token, token_exp, oldUser.verified, oldUser.gender, oldUser.birthday, oldUser.residence, oldUser.profileUrl);
                        newUser.save()
                            .then(() => {
                                req.flash('message', 'Reset link sent, check your email!=2');
                                res.redirect('/reset');
                                return mailer.sendVerificationEmail(email, token, 'reset');
                            })
                            .catch((err) => {
                                const error = new Error(err);
                                error.httpStatusCode = 500;
                                return next(error);
                            });
                    })
                }
            }
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postResetPass = (req, res, next) => {
    if (req.body.password != null && req.body.repeatPassword != null &&
        req.body.password != '' && req.body.repeatPassword != '') {
        if (req.body.password != req.body.repeatPassword) { //if not same
            flashString = 'Passwords are not identical!=1/token=' + req.body.token;
            req.flash('message', flashString);
            res.redirect('/reset');
        } else {
            let newPassword = req.body.password;
            let token = req.body.token;

            db.execute('SELECT * FROM user WHERE token = ?', [token])
                .then(([user]) => {
                    if (user.length > 0) {
                        let oldUser = user[0];
                        bcrypt.hash(newPassword, 12, (err, hash) => {
                            if (!err) {
                                let newUser = new User(oldUser.name, oldUser.surname, oldUser.email, hash, null, null, oldUser.verified, oldUser.gender, oldUser.birthday, oldUser.residence, oldUser.profileUrl);
                                newUser.save()
                                    .then(() => {
                                        if (req.session.userId) {
                                            req.flash('message', 'Password reset successfully!=2');
                                            res.redirect('/settings');
                                        } else {
                                            req.flash('message', 'Password reset successfully, you may log in!=2');
                                            res.redirect('/login');
                                        }
                                    })
                                    .catch((err) => {
                                        const error = new Error(err);
                                        error.httpStatusCode = 500;
                                        return next(error);
                                    });
                            } else {
                                throw new Error(err);
                            }
                        })
                    }
                })
                .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        }
    } else { //fields cannot be null - handle this on front
        flashString = 'Passwords cannot be empty!=1/token=' + req.body.token;
        req.flash('message', flashString);
        res.redirect('/reset');
    }
};