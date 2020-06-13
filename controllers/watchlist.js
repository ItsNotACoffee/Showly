const imdb = require('../util/imdb');
const Entry = require('../models/entry');
const EntrySeason = require('../models/entry_season');
const db = require('../util/database');
const moment = require('moment');

//get
exports.getWatchlist = (req, res, next) => {
    if (req.query.type == null) {
        res.redirect('/watchlist?type=all');
    } else {
        var statuses = [],
            sort = null;
        if (req.query.type == 'all') {
            statuses.push(1, 2, 3, 4);
        } else if (req.query.type == 'completed') {
            statuses.push(1);
        } else if (req.query.type == 'watching') {
            statuses.push(2);
        } else if (req.query.type == 'plantowatch') {
            statuses.push(3);
        } else if (req.query.type == 'dropped') {
            statuses.push(4);
        }

        if (req.query.sortby) {
            if (req.query.page) { //if paging happens do not invert direction of sort
                res.locals.sortDir = req.query.dir;
                sort = req.query.sortby + '+' + req.query.dir;
            } else {
                if (req.query.dir == 'desc') {
                    sort = req.query.sortby + '+' + 'asc';
                    res.locals.sortDir = 'asc';
                } else if (req.query.dir == 'asc') {
                    sort = req.query.sortby + '+' + 'desc';
                    res.locals.sortDir = 'desc';
                }
            }
            res.locals.lastSort = req.query.sortby;
        }

        Entry.getAllByUserId(req.session.userId, statuses)
            .then(([shows]) => {
                return EntrySeason.getAllByUserId(req.session.userId)
                    .then(([seasons]) => {
                        return [shows, seasons];
                    })
            })
            .then((result) => {
                let shows = result[0],
                    seasons = result[1];

                for (let show of shows) { //add seasons on watchlist to shows
                    //fix date formatting
                    show.startDate = show.startDate != null ? moment(show.startDate).format('DD/MM/YYYY') : null;
                    show.endDate = show.endDate != null ? moment(show.endDate).format('DD/MM/YYYY') : null;

                    if (show.type == 'series') {
                        let arrayOfSeasons = [];
                        let episodesWatched = 0;
                        let totalEpisodes = 0;
                        for (let season of seasons) {
                            if (season.watchlistEntryId == show.watchlistEntryId) {
                                season.startDate = season.startDate != null ? moment(season.startDate).format('DD/MM/YYYY') : null;
                                season.endDate = season.endDate != null ? moment(season.endDate).format('DD/MM/YYYY') : null;

                                arrayOfSeasons.push(season);
                                episodesWatched += season.episode;
                                totalEpisodes += season.maxEpisode;
                            }
                        }
                        show["episodesWatched"] = episodesWatched;
                        show["totalEpisodes"] = totalEpisodes;
                        show["seasons"] = arrayOfSeasons;
                    } else { //added for sorting to work
                        show["episodesWatched"] = null;
                        show["totalEpisodes"] = null;
                        show["seasons"] = null;
                    }
                }

                //sort by criteria
                if (sort != null) {
                    if (sort.split('+')[0] == 'title') {
                        if (sort.split('+')[1] == 'desc') {
                            shows.sort((a, b) => b.name.localeCompare(a.name));
                        } else {
                            shows.sort((a, b) => a.name.localeCompare(b.name));
                        }
                    } else if (sort.split('+')[0] == 'genre') {
                        if (sort.split('+')[1] == 'desc') {
                            shows.sort((a, b) => b.tags.localeCompare(a.tags));
                        } else {
                            shows.sort((a, b) => a.tags.localeCompare(b.tags));
                        }
                    } else if (sort.split('+')[0] == 'progress') {
                        if (sort.split('+')[1] == 'desc') {
                            shows.sort((a, b) => {
                                if (a.episodesWatched === b.episodesWatched) { //if equal, dont sort
                                    return 0;
                                } else if (a.episodesWatched === null) { //if a null, sort below b
                                    return 1;
                                } else if (b.episodesWatched === null) { //if b null, sort below a
                                    return -1;
                                } else { 
                                    return a.episodesWatched > b.episodesWatched ? -1 : 1;
                                }
                            });
                        } else {
                            shows.sort((a, b) => {
                                if (a.episodesWatched === b.episodesWatched) {
                                    return 0;
                                } else if (a.episodesWatched === null) {
                                    return 1;
                                } else if (b.episodesWatched === null) {
                                    return -1;
                                } else { 
                                    return a.episodesWatched > b.episodesWatched ? 1 : -1;
                                }
                            });
                        }
                    } else if (sort.split('+')[0] == 'startdate') {
                        if (sort.split('+')[1] == 'desc') {
                            shows.sort((a, b) => {
                                if (new Date(b.startDate) === new Date(a.startDate)) {
                                    return 0;
                                } else if (a.startDate === null) {
                                    return 1;
                                } else if (b.startDate === null) {
                                    return -1;
                                } else { 
                                    return new Date(b.startDate) - new Date(a.startDate);
                                }
                            });
                        } else {
                            shows.sort((a, b) => {
                                if (new Date(b.startDate) === new Date(a.startDate)) {
                                    return 0;
                                } else if (a.startDate === null) {
                                    return 1;
                                } else if (b.startDate === null) {
                                    return -1;
                                } else { 
                                    return new Date(a.startDate) - new Date(b.startDate);
                                }
                            });
                        }
                    } else if (sort.split('+')[0] == 'rating') {
                        if (sort.split('+')[1] == 'desc') {
                            shows.sort((a, b) => (b.rating > a.rating) ? 1 : -1);
                        } else {
                            shows.sort((a, b) => (a.rating > b.rating) ? 1 : -1);
                        }
                    }
                }

                //setup paging
                var resultsPerPage = 30,
                    page = req.query.page ? req.query.page : 1,
                    currentPage = page*resultsPerPage;
                res.locals.lastPage = page;
                var maxPages = Math.ceil((shows.length / resultsPerPage));

                var newShows = [];
                for (var i = currentPage-resultsPerPage; i < (currentPage > shows.length ? shows.length : currentPage); i++) {
                    newShows.push(shows[i]);
                }

                res.locals.lastType = req.query.type;
                res.render('shows/watchlist', {
                    path: '/watchlist',
                    title: 'Your Watchlist - Showly',
                    shows: newShows,
                    maxPages
                });
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};

exports.getWatchlistEdit = (req, res, next) => {
    let imdbId = req.params.imdbid,
        userId = req.session.userId;

    if (req.query.s != null) {
        let season = req.query.s;

        Entry.getByUserAndId(userId, imdbId) //if show exists
            .then(([show]) => {
                if (show.length < 1) {
                    res.redirect('/shows/id/' + imdbId);
                } else {
                    EntrySeason.getByEntryAndSeason(show[0].watchlistEntryId, season) //if season exists
                        .then(([showSeason]) => {
                            if (showSeason.length < 1) {
                                res.redirect('/shows/id/' + imdbId);
                            } else {
                                //set tampering protection
                                req.session.storedId = imdbId + '_' + showSeason[0].watchlistSeasonId + '_s=' + showSeason[0].season;

                                showSeason[0].startDate = moment(showSeason[0].startDate).format('YYYY-MM-DD');
                                showSeason[0].endDate = moment(showSeason[0].endDate).format('YYYY-MM-DD');
                                res.render('shows/edit', {
                                    path: '/watchlist',
                                    title: 'Editing: ' + show[0].name + ' Season ' + season + ' - Showly',
                                    show: show[0],
                                    season: showSeason[0],
                                    back: req.query.b ? req.query.b : null
                                });
                            }
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
    } else {
        Entry.getByUserAndId(userId, imdbId) //if movie exists
            .then(([result]) => {
                if (result.length > 0) {
                    //set tampering protection
                    req.session.storedId = imdbId + '_' + result[0].watchlistEntryId;

                    result[0].startDate = moment(result[0].startDate).format('YYYY-MM-DD');
                    result[0].endDate = moment(result[0].endDate).format('YYYY-MM-DD');
                    res.render('shows/edit', {
                        path: '/watchlist',
                        title: 'Editing: ' + result[0].name + ' - Showly',
                        show: result[0],
                        season: null,
                        back: req.query.b ? req.query.b : null
                    });
                } else {
                    res.redirect('/shows/id/' + imdbId);
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
}

//post
exports.postAddToWatchlist = (req, res, next) => {
    let imdbId = req.body.imdbid,
        userId = req.session.userId;

    imdb.get({ id: imdbId })
        .then((show) => {
            if (show.type == 'movie') {
                let newEntry = new Entry(userId, imdbId, show.name, show.poster, show.type, show.genres, null, null, null, null, 3, new Date());
                return newEntry.save()
                    .then(() => {
                        res.redirect('/shows/id/' + imdbId);
                    })
                    .catch((err) => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
            }
            else if (show.type == 'series') {
                show.episodes()
                    .then((episodes) => {
                        let totalSeasons = null;
                        for (var i = 1; i <= show.totalseasons; i++) {
                            let totalEps = 0;
                            for (let episode of episodes) {
                                if (episode.season == i) {
                                    if (episode.episode > totalEps) { totalEps = episode.episode }
                                }
                            }

                            if (i == 1) {
                                totalSeasons = [[i, totalEps]];
                            } else {
                                totalSeasons = [...totalSeasons, [i, totalEps]];
                            }
                        }
                        EntrySeason.saveAll(totalSeasons, imdbId, userId)
                            .then(() => {
                                res.redirect('/shows/id/' + imdbId);
                            })
                            .catch((err) => {
                                const error = new Error(err);
                                error.httpStatusCode = 500;
                                return next(error);
                            });
                    })
            }
            else return;
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postAddSeasonToWatchlist = (req, res, next) => {
    let imdbId = req.body.imdbid,
        userId = req.session.userId,
        season = req.body.selectedseason;

    imdb.get({ id: imdbId }) //fetch all data
        .then((show) => {
            return show.episodes()
                .then((episodes) => {
                    return Entry.getByUserAndId(userId, imdbId)
                        .then(([entry]) => {
                            return [show, entry, episodes];
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
        .then((result) => { //resolve
            let dbShow = result[0],
                dbEntry = result[1],
                dbEpisodes = result[2];

            let maxEpisode = 0;
            for (let episode of dbEpisodes) {
                if (episode.season == season) {
                    if (episode.episode > maxEpisode) { maxEpisode = episode.episode }
                }
            }

            if (dbEntry[0] != null) { //if show already added, add season only
                let newSeason = new EntrySeason(dbEntry[0].watchlistEntryId, season, maxEpisode, 3, null, null, null, null);
                return newSeason.save();
            } else {
                let newShow = new Entry(userId, imdbId, dbShow.name, dbShow.poster, dbShow.type, dbShow.genres, null, null, null, null, 3, new Date());
                return newShow.save()
                    .then(([result]) => {
                        let newSeason = new EntrySeason(result.insertId, season, maxEpisode, 3, null, null, null, null);
                        return newSeason.save();
                    })
                    .catch((err) => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
            }
        })
        .then((result) => { //redirect
            res.redirect('/shows/id/' + imdbId);
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postWatchlistEdit = (req, res, next) => {
    let imdbId = req.body.imdbid,
        userId = req.session.userId,
        id = req.body.id;

    if (req.session.storedId != null && req.session.storedId == imdbId + '_' + id) {
        if (id.toString().includes('s=')) { //if it's a season
            EntrySeason.getById(id)
                .then(([season]) => {
                    if (season.length > 0) {
                        return EntrySeason.checkEditPermission(id.split('_')[0], imdbId, season[0].season, userId)
                            .then(([result]) => {
                                if (result.length > 0) {
                                    return season;
                                } else {
                                    return null;
                                }
                            })
                            .catch((err) => {
                                const error = new Error(err);
                                error.httpStatusCode = 500;
                                return next(error);
                            });
                    } else {
                        return null;
                    }
                })
                .then(([result]) => {
                    if (result == null) {
                        res.redirect('/watchlist/edit/' + imdbId);
                    } else {
                        let status = req.body.status,
                            episode = req.body.episode,
                            startDate = req.body.startDate == '' ? null : req.body.startDate,
                            endDate = req.body.endDate == '' ? null : req.body.endDate,
                            rating = req.body.rating == 0 ? null : req.body.rating;

                        updatedSeason = new EntrySeason(result.watchlistEntryId, result.season, null, status, episode, startDate, endDate, rating);
                        updatedSeason.save()
                            .then((result) => {
                                if (req.body.back && req.body.back == 'wl') {
                                    res.redirect('/watchlist');
                                } else {
                                    res.redirect('/shows/id/' + imdbId);
                                }
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
        } else { //if it's a movie
            Entry.getById(id)
                .then(([show]) => {
                    if (show.length > 0) {
                        return Entry.checkEditPermission(id, imdbId, userId)
                            .then(([result]) => {
                                if (result.length > 0) {
                                    return show;
                                } else {
                                    return null;
                                }
                            })
                            .catch((err) => {
                                const error = new Error(err);
                                error.httpStatusCode = 500;
                                return next(error);
                            });
                    } else {
                        return null;
                    }
                })
                .then(([show]) => {
                    if (show == null) {
                        res.redirect('/watchlist/edit/' + imdbId);
                    } else {
                        let status = req.body.status,
                            rating = req.body.rating == 0 ? null : req.body.rating,
                            startDate = req.body.startDate == '' ? null : req.body.startDate,
                            endDate = req.body.endDate == '' ? null : req.body.endDate,
                            comment = req.body.comment;

                        updatedEntry = new Entry(show.userId, show.imdbId, null, null, null, show.tags, startDate, endDate, rating, comment, status, null);
                        updatedEntry.save()
                            .then(() => {
                                if (req.body.back && req.body.back == 'wl') {
                                    res.redirect('/watchlist');
                                } else {
                                    res.redirect('/shows/id/' + imdbId);
                                }
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
    } else {
        if (id.toString().includes('s=')) {
            res.redirect('/watchlist/edit/' + imdbId + '?s=' + id.split('=')[1]);
        } else {
            res.redirect('/watchlist/edit/' + imdbId);
        }
        console.log("tampering detected");
    }
};

exports.postWatchlistDelete = (req, res, next) => {
    var userId = req.session.userId,
        imdbId = req.body.imdbid,
        id = req.body.id;

    if (req.body.season) { //delete season
        EntrySeason.checkEditPermission(id, imdbId, req.body.season, userId)
            .then((result) => {
                if (result.length > 0) {
                    EntrySeason.deleteItem(id, imdbId, userId)
                        .then((result) => {
                            res.redirect('/watchlist');
                        })
                        .catch((err) => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                } else {
                    res.redirect('/watchlist');
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    } else { //delete show
        Entry.checkEditPermission(id, imdbId, userId)
            .then((result) => {
                if (result.length > 0) {
                    Entry.deleteItem(id, imdbId, userId)
                        .then((result) => {
                            res.redirect('/watchlist');
                        })
                        .catch((err) => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                } else {
                    res.redirect('/watchlist');
                }
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }
};