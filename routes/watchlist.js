const express = require('express');
const watchlistController = require('../controllers/watchlist');
const antitamper = require('../util/antitamper');
const isLoggedIn = require('../util/isLoggedIn');

const router = express.Router();

//get
router.get('/watchlist', isLoggedIn, antitamper, watchlistController.getWatchlist);
router.get('/watchlist/edit/:imdbid', isLoggedIn, antitamper, watchlistController.getWatchlistEdit);

//post
router.post('/watchlist/add', watchlistController.postAddToWatchlist);
router.post('/watchlist/add-seasons', watchlistController.postAddSeasonToWatchlist);
router.post('/watchlist/edit', watchlistController.postWatchlistEdit);
router.post('/watchlist/del', watchlistController.postWatchlistDelete);

module.exports = router;