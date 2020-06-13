const imdb = require('../util/imdb');
const moment = require('moment');
const Entry = require('../models/entry');
const EntrySeason = require('../models/entry_season');

//get
exports.getSearch = (req, res, next) => {
    let searchString = req.query.str;
    let searchType = req.query.type;
    let page = req.query.page;

    res.locals.lastQuery = searchString;
    res.locals.lastType = searchType;
    res.locals.lastPage = page;

    if (searchString && searchType && page) {
        imdb.search({ 'name': searchString, reqtype: searchType }, page)
            .then((shows) => {
                let maxPages;
                if (shows.totalresults < 10) {
                    maxPages = 1;
                } else {
                    maxPages = Math.ceil((shows.totalresults / 10));
                }

                res.render('shows/search', {
                    path: '/search',
                    title: 'Search: ' + searchString + ' - Showly',
                    shows: shows.results,
                    maxPages: maxPages
                });
            })
            .catch((err) => { //handle search error responses
                let message = err.message.toString();
                if (message.includes('Too many results')) {
                    res.locals.errorType = 'TooManyResults';
                    res.render('shows/search', {
                        path: '/search',
                        title: 'Too many results - Showly',
                        shows: [],
                        maxPages: 0
                    });
                } else if (message.includes('Movie not found') || message.includes('Series not found')) {
                    res.locals.errorType = 'NotFound';
                    res.render('shows/search', {
                        path: '/search',
                        title: 'Not found - Showly',
                        shows: [],
                        maxPages: 0
                    });
                } else {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                }
            });
    } else {
        res.redirect('/');
    }
};

exports.getShowDetails = (req, res, next) => {
    const imdbId = req.params.imdbid;

    imdb.get({ id: imdbId })
        .then((show) => {
            //handle ratings
            let ratings = [];
            show.ratings.forEach(rating => {
                let rValue;

                if (rating.Source == 'Internet Movie Database') {
                    rValue = parseInt(rating.Value.split('/')[0]);
                    rValue = rValue * 10;
                } else if (rating.Source == 'Rotten Tomatoes') {
                    rValue = parseInt(rating.Value.substring(0, rating.Value.length - 1));
                } else if (rating.Source == 'Metacritic') {
                    rValue = parseInt(rating.Value.split('/')[0]);
                }

                if (rValue < 50) {
                    ratings.push({ "color": "red", "rating": rating.Value, "source": rating.Source });
                } else if (rValue > 49 && rValue < 75) {
                    ratings.push({ "color": "yellow", "rating": rating.Value, "source": rating.Source });
                } else if (rValue > 74) {
                    ratings.push({ "color": "green", "rating": rating.Value, "source": rating.Source });
                }
            });

            //add unknown ratings
            let finalRatings = [...ratings];
            if (ratings.length < 3) {
                let imdb = false,
                    rotten = false,
                    metacr = false;
                ratings.forEach((rating) => {
                    if (rating.source == 'Internet Movie Database') {
                        imdb = true;
                    } else if (rating.source == 'Rotten Tomatoes') {
                        rotten = true;
                    } else if (rating.source == 'Metacritic') {
                        metacr = true;
                    }
                });

                if (!imdb) {
                    finalRatings.push({ "color": "red", "rating": "N/A", "source": "Internet Movie Database" });
                }
                if (!rotten) {
                    finalRatings.push({ "color": "red", "rating": "N/A", "source": "Rotten Tomatoes" });
                }
                if (!metacr) {
                    finalRatings.push({ "color": "red", "rating": "N/A", "source": "Metacritic" });
                }
            }

            if (req.session != null && req.session.userId != null) { //check if user has seasons added
                return EntrySeason.getAddedSeasons(imdbId, req.session.userId)
                    .then((seasons) => {
                        if (seasons != null) {
                            return [show, finalRatings, seasons];
                        } else {
                            return [show, finalRatings, null];
                        }
                    })
                    .catch((err) => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
            } else {
                return [show, finalRatings, null];
            }
        })
        .then((results) => { //check if user has the show added
            if (req.session != null && req.session.userId != null) {
                return Entry.getByUserAndId(req.session.userId, imdbId)
                    .then(([dbShow]) => {
                        if (dbShow.length > 0) {
                            let maxEpisodes = 0,
                                episodesWatched = 0,
                                newSeasons = [];

                            if (results[2] != null) {
                                let dbSeasons = results[2];

                                for (var i = 0; i < dbSeasons.length; i++) {
                                    el = dbSeasons[i];
                                    episodesWatched += el[1];
                                    maxEpisodes += el[2];
                                    newSeasons.push(el[0]);
                                }
                            } else {
                                maxEpisodes = 1;
                                episodesWatched = 1;
                            }
                            //bind user show details for the show
                            results[0]._userInfo = dbShow[0];
                            results[0]._userInfo._episodesWatched = episodesWatched;
                            results[0]._userInfo._maxEpisodes = maxEpisodes;

                            return [results[0], results[1], newSeasons, true];
                        } else {

                            results[0]._userInfo = null;
                            return [results[0], results[1], results[2], false];
                        }
                    })
                    .catch((err) => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
            } else {
                results[0]._userInfo = null;
                //show, ratings, seasons, showAdded
                return [results[0], results[1], results[2], false];
            }
        })
        .then((results) => {
            let show = results[0],
                finalRatings = results[1],
                seasons = results[2],
                showAdded = results[3];

            var newShow = null;
            if (show.series == true) {
                show.episodes()
                    .then((episodes) => {
                        //fix date formatting
                        for (let episode of episodes) {
                            var date = episode.released;
                            episode.released = moment(date).format('DD/MM/YYYY');
                        }
                        if (show._userInfo != null) {
                            show._userInfo.startDate = show._userInfo.startDate ? moment(show._userInfo.startDate).format('DD/MM/YYYY') : '/-/';
                            show._userInfo.endDate = show._userInfo.endDate ? moment(show._userInfo.endDate).format('DD/MM/YYYY') : '/-/';
                        }
                        show._episodes = episodes;

                        res.render('shows/details', {
                            path: '/details',
                            title: 'Info: ' + show.title + ' - Showly',
                            show: show,
                            ratings: finalRatings,
                            addedSeasons: seasons,
                            showAdded: showAdded
                        });
                    })
                    .catch((err) => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
            } else {
                //fix date formatting
                if (show._userInfo != null) {
                    show._userInfo.startDate = show._userInfo.startDate ? moment(show._userInfo.startDate).format('DD/MM/YYYY') : '/-/';
                    show._userInfo.endDate = show._userInfo.endDate ? moment(show._userInfo.endDate).format('DD/MM/YYYY') : '/-/';
                }
                res.render('shows/details', {
                    path: '/details',
                    title: 'Info: ' + show.title + ' - Showly',
                    show: show,
                    ratings: finalRatings,
                    addedSeasons: null,
                    showAdded: showAdded
                });
            }
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};