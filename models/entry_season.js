const db = require('../util/database');
const imdb = require('../util/imdb');
const Entry = require('./entry');

module.exports = class EntrySeason {
    constructor(watchlistEntryId, season, maxEpisode, status, episode, startDate, endDate, rating) {
        this.watchlistEntryId = watchlistEntryId,
            this.season = season,
            this.maxEpisode = maxEpisode,
            this.status = status,
            this.episode = episode,
            this.startDate = startDate,
            this.endDate = endDate,
            this.rating = rating
    }
    // status = 4 (dropped), 3 (plan to watch), 2 (watching), 1 (completed)

    save() { //saves a single season to database
        return db.execute('SELECT * FROM watchlistseason WHERE watchlistEntryId = ? AND season = ?', [this.watchlistEntryId, this.season])
            .then(([entry]) => {
                if (entry.length > 0) { //update
                    let seasonId = entry[0].watchlistSeasonId;
                    return db.execute('UPDATE watchlistseason SET status = ?, episode = ?, startDate = ?, endDate = ?, rating = ? WHERE watchlistSeasonId = ?',
                        [this.status, this.episode, this.startDate, this.endDate, this.rating, seasonId]);
                } else { //insert
                    return db.execute('INSERT INTO watchlistseason (watchlistEntryId, season, maxEpisode, status, episode, startDate, endDate, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [this.watchlistEntryId, this.season, this.maxEpisode, this.status, this.episode, this.startDate, this.endDate, this.rating]);
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }

    static saveAll(seasons, imdbId, userId) { //saves an array of seasons to database, array = [[watchlistEntryId, status, season, maxEpisode], ...]
        return db.execute('SELECT * FROM watchlistentry a JOIN watchlistseason b ON a.watchlistEntryId = b.watchlistEntryId WHERE a.watchlistEntryId = ?', [imdbId])
            .then(([entry]) => {
                if (entry.length < 1) { //if no show is added, add it first
                    return imdb.get({ id: imdbId })
                        .then((show) => {
                            let newEntry = new Entry(userId, imdbId, show.name, show.poster, show.type, show.genres, null, null, null, null, 3, new Date());
                            return newEntry.save()
                                .then((result) => {
                                    return result;
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
                } else {
                    return entry[0];
                }
            })
            .then((result) => {
                if (result[0].insertId == 0) { //if show already exists, do nothing
                    return result;
                } else if (result[0].insertId != 0) { //show added 
                    let watchlistEntryId = result[0].insertId;
                    let updatedSeasons = null;

                    for (var i = 0; i < seasons.length; i++) {
                        if (i == 0) {
                            let temp = seasons[i];
                            updatedSeasons = [[watchlistEntryId, 3, temp[0], temp[1]]];
                        } else {
                            let temp = seasons[i];
                            updatedSeasons = [...updatedSeasons, [watchlistEntryId, 3, temp[0], temp[1]]];
                        }
                    }
                    db.query('INSERT INTO watchlistseason (watchlistEntryId, status, season, maxEpisode) VALUES ?', [updatedSeasons])
                        .then((result) => {
                            return result;
                        })
                        .catch((err) => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }

    static getAddedSeasons(imdbId, userId) { //fetches an array of seasons with episodes and maxepisode for a show, if they exist
        return db.execute('SELECT season, episode, maxEpisode FROM watchlistseason a JOIN watchlistentry b ON a.watchlistEntryId = b.watchlistEntryId WHERE b.imdbId = ? AND b.userId = ?', [imdbId, userId])
            .then(([result]) => {
                if (result.length < 1) {
                    return null;
                } else {
                    let seasons = [];
                    for (var i = 0; i < result.length; i++) {
                        seasons.push([result[i].season, result[i].episode, result[i].maxEpisode]);
                    }
                    return seasons;
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }

    static getByEntryAndSeason(watchlistEntryId, season) {
        return db.execute('SELECT * FROM watchlistseason WHERE watchlistEntryId = ? AND season = ?', [watchlistEntryId, season]);
    }

    static getById(seasonId) {
        return db.execute('SELECT * FROM watchlistseason WHERE watchlistSeasonId = ?', [seasonId]);
    }

    static getAllByUserId(userId) {
        return db.execute('SELECT * FROM watchlistentry a JOIN watchlistseason b ON a.watchlistEntryId = b.watchlistEntryId WHERE a.userId = ?', [userId]);
    }

    static checkEditPermission(watchlistSeasonId, imdbId, season, userId) {
        return db.execute('SELECT 1 FROM user a JOIN watchlistentry b ON a.userId = b.userId JOIN watchlistseason c ON b.watchlistEntryId = c.watchlistEntryId '
            + 'WHERE a.userId = ? AND b.imdbId = ? AND c.season = ? AND c.watchlistSeasonId = ?', [userId, imdbId, season, watchlistSeasonId]);
    }

    static deleteItem(watchlistSeasonId, imdbId, userId) {
        return db.execute('SELECT COUNT(*) FROM user a JOIN watchlistentry b ON a.userId = b.userId JOIN watchlistseason c ON b.watchlistEntryId = c.watchlistEntryId WHERE a.userId = ? AND b.imdbId = ?', [userId, imdbId])
            .then((result) => {
                var count = result[0];
                count = count[0];
                if (count['COUNT(*)'] < 2) { //if last season, also delete the show
                    return db.execute('DELETE FROM watchlistseason WHERE watchlistSeasonId = ?', [watchlistSeasonId])
                        .then((res) => {
                            return db.execute('DELETE FROM watchlistentry WHERE userId = ? AND imdbId = ?', [userId, imdbId]);
                        })
                        .catch((err) => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                } else {
                    return db.execute('DELETE FROM watchlistseason WHERE watchlistSeasonId = ?', [watchlistSeasonId]);
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
}