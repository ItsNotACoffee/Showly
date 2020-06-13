const db = require('../util/database');

module.exports = class User {
    constructor(name, surname, email, password, token, token_exp, verified, gender, birthday, residence, profileUrl) {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password;
        this.token = token;
        this.token_exp = token_exp;
        this.verified = verified;
        this.gender = gender;
        this.birthday = birthday;
        this.residence = residence;
        this.profileUrl = profileUrl;
    }

    save() {
        return db.execute('SELECT * FROM user WHERE email = ?', [this.email])
            .then(([user]) => {
                if (user.length > 0) { //update
                    let userId = user[0].userId;
                    return db.execute('UPDATE user SET name = ?, surname = ?, email = ?, password = ?, token = ?, token_exp = ?, verified = ?, gender = ?, birthday = ?, residence = ?, profileUrl = ? WHERE userId = ?',
                        [this.name, this.surname, this.email, this.password, this.token, this.token_exp, this.verified, this.gender, this.birthday, this.residence, this.profileUrl, userId]);
                } else { //insert
                    return db.execute('INSERT INTO user (name, surname, email, password, token, token_exp, verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [this.name, this.surname, this.email, this.password, this.token, this.token_exp, this.verified]);
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }

    static getUserById(userId) {
        return db.execute('SELECT * FROM user WHERE userId = ?', [userId]);
    }

    static getUserByEmail(email) {
        return db.execute('SELECT * FROM user WHERE email = ?', [email]);
    }

    static getUserPfpById(userId) {
        return db.execute('SELECT profileUrl FROM user WHERE userId = ?', [userId]);
    }
}