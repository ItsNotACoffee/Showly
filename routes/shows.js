const path = require('path');
const express = require('express');
const showsController = require('../controllers/shows');
const antitamper = require('../util/antitamper');

const router = express.Router();

//get
router.get('/search', antitamper, showsController.getSearch);
router.get('/id/:imdbid', antitamper, showsController.getShowDetails);

//post

module.exports = router;