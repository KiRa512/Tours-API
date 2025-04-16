const express = require('express')
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const multer = require('multer')

const Router = express.Router();



Router.post('/signup',authController.signUp);
Router.post('/login',authController.logIn);  
Router.post('/forgotPassword',authController.forgotPassword);  
Router.patch('/resetPassword/:token',authController.resetPassword);  

Router.use(authController.protect);

Router.get('/me',userController.getMe,userController.getUser)

Router.patch('/updatePassword/',authController.updatePassword);  

Router.patch('/updateMe',userController.uploadUserPhoto,
    userController.resizePhoto,
    userController.updateMe);  

Router.delete('/deleteMe',userController.deleteMe);  


Router.use(authController.restrictTo('admin','lead-guide'))

Router
.route('/')
.get(userController.getAllUsers)
.post(userController.createUser);

Router.
route('/:id')
.get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser);

module.exports = Router;
