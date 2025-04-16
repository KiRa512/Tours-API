const { promisify } = require('util');
const crypto = require('crypto')
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const appError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
//const { decode } = require('punycode');


const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user , statusCode , res)=>{
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_EXPIRES_IN_Cookie * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'lax'  // Add this to ensure cookie is sent in most contexts
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    console.log('Setting cookie with options:', cookieOptions);
    res.cookie('jwt',token,cookieOptions);
    user.password = undefined; 
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}


exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role // Include this line

    });
    createSendToken(newUser , 201 , res)
    
});

exports.logIn = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1 => check if email and password exist
    if (!email || !password) {
        return next(new appError('Please provide email and password', 400));
    }

    // 2 => check if user exists and password is correct 
    const user = await User.findOne({ email }).select('+password');

    console.log(user);

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new appError('Incorrect email or password', 401))
    }
    //3 => if verified send token to client
    createSendToken(user , 200 , res)
});


exports.protect = catchAsync(async (req , res , next)=>{
    // 1) Get the token and check if it exists
    let token;
    console.log('Full Request Headers:', req.headers);
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    console.log('Raw Authorization Header:', req.headers.authorization);
    console.log('Extracted Token:', token);

    if (!token) {
        return next(new appError('Please sign in', 401));
    }

    // 2) Validate token format
    if (typeof token !== 'string' || token.split('.').length !== 3) {
        return next(new appError('Invalid token format', 401));
    }

    // 3) Verify token
    let decoded;
    try {
        decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (err) {
        console.log('Verification Error:', err.name, err.message);
        return next(new appError(`Token error: ${err.message}`, 401));
    }
    console.log('Decoded Payload:', decoded);

    // 4) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new appError('The user no longer exists', 401));
    }

    req.user = currentUser;
    next();
})


exports.restrictTo = (...roles)=> {
    return (req,res,next)=> {
        if (!roles.includes(req.user.role)) {
            next(new appError('You dont have access to perform this action',403));
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async(req ,res ,next) => {
    // 1 get the user based on user email
    const user = await User.findOne({email:req.body.email})
    if (!user){
        return next(new appError('There is no user with this email',404));
    }
    // 2) generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave:false});
    // 3) Send to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}. 
    Token valid for 10 minutes.`;    
    try{
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token valid for 10 mins',
            message
        }) 
        res.status(200).json({
            status: 'success',
            message: 'token sent to mail'
        })
    } catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpired = undefined;
        await user.save({validateBeforeSave:false});
        next(new appError('There was an error sending the email',500))
    }
})

exports.resetPassword = catchAsync(async (req ,res ,next)=>{
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: hashedToken });

    // 2) if the token hasn't expired and the user exists set the new password
    if (!user){
        return next(new appError('Token is invalid or has expired',400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save();
    
    // 3) Update changedPassword field for the user

    // 4) Log The user hashedTokenin , send JWT
    
    createSendToken(user , 200 , res)
})


exports.updatePassword = catchAsync(async(req,res,next)=>{

    // 1) Get the user from the collection
    const user = await User.findById(req.user.id).select('+password')

    // 2) Check if the password is correct
    if(!(await user.correctPassword(req.body.currentPassword,user.password))) {
        return next(new appError('Your current Password is wrong',401));
    }


    // 3) If So update Password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save()


    // 4) Log user in and send JWT
    createSendToken(user , 200 , res)

});

