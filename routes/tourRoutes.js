const express = require('express')
const Router = express.Router();
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController')
const reviewRouter = require('./reviewRoutes');
// Route Handlers
// Router.param('id', tourController.checkTourId);

Router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);
Router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
Router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);



Router.use('/:tourId/reviews',reviewRouter);


Router
.route('/')
.get(tourController.getAllTours)
.post( authController.protect,authController.restrictTo('admin','lead-guide'),tourController.createTour);

Router.route('/toursWithin/:distance/center/:latlng/unit/:unit')
.get(tourController.getToursWithin);


Router.route('/tour-stats').get(tourController.getTourStats)




Router
.route('/:id')
.get(tourController.getTour)
.patch(authController.protect,
    authController.restrictTo('admin','lead-guide'),
    tourController.updateTour)
.delete(authController.protect , 
    authController.restrictTo('admin','lead-guide') ,
    tourController.deleteTour);


    


module.exports = Router;
