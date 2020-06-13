const db = require('../util/database');
const User = require('../models/user');
const moment = require('moment');
const fs = require('fs');

//get
exports.getSettings = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        User.getUserById(req.session.userId)
        .then(([user]) => {
            if (user.length > 0) {
                //fix birthday format
                user[0].birthday = moment(user[0].birthday).format('YYYY-MM-DD');
                
                let message = req.session.flash ? req.flash('message') : null,
                    msgType = 0;

                if (message && message.length > 0) {
                    msgType = message[0].split('=')[1];
                    message = message[0].split('=')[0];
                }
                res.render('misc/settings', {
                    path: '/settings',
                    title: 'Settings - Showly',
                    user: user[0],
                    message: message,
                    messageType: msgType
                });
            } else {
                res.redirect('/');
            }
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    }
};

exports.getAbout = (req, res, next) => {
    res.render('misc/about', {
        path: '/about',
        title: 'About - Showly'
    });
};

//post
exports.postSettings = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        User.getUserById(req.session.userId)
        .then(([oldUser]) => {
            if (oldUser.length > 0) {
                if (req.body.removeProfile == 1) { //if removing the profile url
                    let fileNameWithPath = oldUser[0].profileUrl;
                    if (fileNameWithPath != null) {
                        fs.unlink(fileNameWithPath, (err) => {
                            console.log(err);
                        });
    
                        let newUser = new User(oldUser[0].name, oldUser[0].surname, oldUser[0].email, oldUser[0].password, oldUser[0].token, oldUser[0].token_exp, oldUser[0].verified, oldUser[0].gender, oldUser[0].birthday, oldUser[0].residence, null);
                        newUser.save()
                        .then((result) => {
                            req.flash('message', 'Profile picture removed!=2');
                            res.redirect('/settings');
                        })
                        .catch((err) => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                    } else {
                        res.redirect('/settings');
                    }
                } else { //if saving settings
                    //fix birthday format
                    var name = req.body.name ? req.body.name : null,
                        surname = req.body.surname ? req.body.surname : null,
                        birthday = req.body.birthday ? req.body.birthday : null,
                        residence = req.body.residence ? req.body.residence : null,
                        gender = req.body.gender ? req.body.gender : null,
                        image = req.file ? req.file : null;
                    
                    var profileUrl = null;
                    if (image != null) { //set new profile image and delete old if exists
                        profileUrl = image.path;
    
                        if (oldUser[0].profileUrl != null) {
                            let fileNameWithPath = oldUser[0].profileUrl;
    
                            fs.unlink(fileNameWithPath, (err) => {
                                console.log(err);
                            });
                        }
                    } else {
                        profileUrl = oldUser[0].profileUrl;
                    }
    
                    if (name.length > 150 || surname.length > 150 || residence > 150) {
                        req.flash('message', 'Name/Surname/Residence cannot be longer than 150 chars!=1');
                        res.redirect('/settings');
                    } else {
                        let newUser = new User(name, surname, oldUser[0].email, oldUser[0].password, oldUser[0].token, oldUser[0].token_exp, oldUser[0].verified, gender, birthday, residence, profileUrl);
                        newUser.save()
                        .then((result) => {
                            req.flash('message', 'Settings saved!=2');
                            res.redirect('/settings');
                        })
                        .catch((err) => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                    }
                }
            } else {
                res.redirect('/');
            }
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    }
};