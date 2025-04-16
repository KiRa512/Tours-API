const express = require('express')
const Router = express.Router({mergeParams: true});
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

Router.use(authController.protect);
Router.route('/')
.get(reviewController.getAllReviews)
.post(authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview);


Router.route('/:id')
.get(reviewController.getReview)

Router.route('/:id')
.get(reviewController.getReview)
.delete(authController.restrictTo('user','admin'),reviewController.deleteReview)
.patch(authController.restrictTo('user','admin'),reviewController.updateReview)




module.exports = Router;