const path = require('path');
const express = require('express');
const mainController = require('../controllers/main');
const antitamper = require('../util/antitamper');
const isLoggedIn = require('../util/isLoggedIn');

const router = express.Router();

//get
router.get('/', antitamper, mainController.getIndex);
router.get('/login', antitamper, mainController.getLogin);
router.get('/register', antitamper, mainController.getRegister);
router.get('/confirm', antitamper, mainController.getConfirm);
router.get('/reset', antitamper, mainController.getReset);
router.get('/dashboard', antitamper, isLoggedIn, mainController.getDashboard);

//post
router.post('/register', mainController.postRegister);
router.post('/login', mainController.postLogin);
router.post('/signout', mainController.postSignout);
router.post('/reset', mainController.postReset);
router.post('/resetpass', mainController.postResetPass);

module.exports = router;