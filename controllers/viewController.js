const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const authController = require('../controllers/authController')
exports.getOverView = catchAsync(async(req , res )=>{
    const tours = await Tour.find();
    res.status(200).render('overview',{
        length: tours.length,
        title: 'All Tours',
        tours
    });
})

exports.getTour = catchAsync(async(req , res , next )=>{
    // Get The Tour for the requested tour 
    const tour = await Tour.findOne({slug:req.params.slug}).populate({
        path:'reviews',
        fields: 'review rating user'
    });
   // console.log('Tour:', tour);


    // build Template


    // Render Template
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
})

exports.getLogInForm = async(req,res)=>{
    res.status(200).render('login',{
        title: 'Log into Your Account'
    })
}
exports.getAccount = async(req,res)=>{
    res.status(200).render('account',{
        title: 'Your Account'
    })
}

