const appError = require("../utils/appError");

const handleCastErrorDB = err =>{
    const message = `Invalid ${err.path}: ${err.value}`;
    return new appError(message, 400);
};

const handleDuplicateFieldsDB = err =>{
    const message = `Duplicate field value: ${err.keyValue.name}. Please use another value!`;
    return new appError(message , 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new appError(message, 400);
}

const handleWebError = err => new appError('Invalid Token please log in again',401)

const handleExpiredError = err => new appError('Expired Token please log in again',401);

const sendErrorDev = (err , res)=>{
    res.status(err.statusCode).json({
        status: err.status,
        stack: err.stack,
        message: err.message,
        error: err
    });
}

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    else {
        console.error('Error', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
}



module.exports = (err,req,res,next)=>{
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';


    if (process.env.NODE_ENV === 'development'){
        sendErrorDev(err,res);
    }
    else if (process.env.NODE_ENV === 'production'){
        let error = {...err};
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleWebError(error)
        if (error.name === 'TokenExpiredError') error = handleExpiredError(error)
        
        sendErrorProd(error,res);
    }
    
};