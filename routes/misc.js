const express = require('express');
const miscController = require('../controllers/misc');
const antitamper = require('../util/antitamper');
const isLoggedIn = require('../util/isLoggedIn');

const router = express.Router();

//get
router.get('/settings', antitamper, isLoggedIn, miscController.getSettings);
router.get('/about', antitamper, isLoggedIn, miscController.getAbout);

//post
router.post('/settings', antitamper, isLoggedIn, miscController.postSettings);

module.exports = router;