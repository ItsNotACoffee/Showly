const db = require('../util/database');

module.exports = class Entry {
    constructor(userId, imdbId, name, poster, type, tags, startDate, endDate, rating, comment, status, dateAdded) {
        this.userId = userId,
        this.imdbId = imdbId,
        this.name = name,
        this.poster = poster,
        this.type = type,
        this.tags = tags,
        this.startDate = startDate,
        this.endDate = endDate,
        this.rating = rating,
        this.comment = comment,
        this.status = status,
        this.dateAdded = dateAdded
    }
    // status = 4 (dropped), 3 (plan to watch), 2 (watching), 1 (completed)

    save() {
        return db.execute('SELECT * FROM watchlistentry WHERE userId = ? AND imdbId = ?', [this.userId, this.imdbId])
            .then(([entry]) => {
                if (entry.length > 0) { //update
                    let entryId = entry[0].watchlistEntryId;
                    return db.execute('UPDATE watchlistentry SET tags = ?, startDate = ?, endDate = ?, rating = ?, comment = ?, status = ? WHERE watchlistEntryId = ?',
                    [this.tags, this.startDate, this.endDate, this.rating, this.comment, this.status, entryId]);
                } else { //insert
                    return db.execute('INSERT INTO watchlistentry (userId, imdbId, name, poster, type, tags, startDate, endDate, rating, comment, status, dateAdded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [this.userId, this.imdbId, this.name, this.poster, this.type, this.tags, this.startDate, this.endDate, this.rating, this.comment, this.status, this.dateAdded]);
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }

    static getById(watchlistEntryId) {
        return db.execute('SELECT * FROM watchlistentry WHERE watchlistEntryId = ?', [watchlistEntryId]);
    }

    static getByUserAndId(userId, imdbId) {
        return db.execute('SELECT * FROM watchlistentry WHERE userId = ? AND imdbId = ?', [userId, imdbId]);
    }

    static getAllByUserId(userId, statuses) {
        return db.query('SELECT * FROM watchlistentry WHERE userId = ? AND status IN (?)', [userId, statuses]);
    }

    static checkEditPermission(watchlistEntryId, imdbId, userId) {
        return db.execute('SELECT 1 FROM user a JOIN watchlistentry b ON a.userId = b.userId WHERE a.userId = ? AND b.imdbId = ? AND b.watchlistEntryId = ?', [userId, imdbId, watchlistEntryId]);
    }

    static deleteItem(watchlistEntryId, imdbId, userId) {
        return db.execute('DELETE FROM watchlistseason WHERE watchlistEntryId = ?', [watchlistEntryId]) //delete all related seasons first, if any
        .then((result) => {
            return db.execute('DELETE FROM watchlistentry WHERE watchlistEntryId = ? AND imdbId = ? and userId = ?', [watchlistEntryId, imdbId, userId]);
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    }
}