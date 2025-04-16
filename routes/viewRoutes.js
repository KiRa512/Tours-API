const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();


router.get('/', viewController.getOverView);

router.get('/tour/:slug', viewController.getTour);

router.get('/login',viewController.getLogInForm)
router.get('/me',authController.protect,viewController.getAccount)

module.exports = router;

