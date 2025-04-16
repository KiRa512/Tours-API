const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors'); // Add this
const cookieParser = require('cookie-parser');
const viewRouter = require('./routes/viewRoutes');

// Custom modules
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const appError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errController');

// Initialize Express app
const app = express();

// Template engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    credentials: true // Allow credentials
}));


// Middleware
// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "https://cdnjs.cloudflare.com/ajax/libs/axios/1.8.4/axios.min.js"],
                connectSrc: ["'self'", "http://localhost:3000"]
            }
        }
    })
);
// Logging in development mode
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate limiting for API endpoints
const limiter = rateLimit({
    max: 100,              // Max 100 requests per IP
    windowMs: 60 * 60 * 1000, // 1 hour window
    message: 'Too many requests from this IP. Please try again in an hour.',
});
app.use('/api/', limiter);

// Parse JSON bodies into req.body with a 10kb limit
app.use(express.json({ limit: '10kb' }));

// Parse cookies
app.use(cookieParser());


app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    console.log('Cookies',req.cookies);
    next();
})
// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Sanitize data against XSS attacks
app.use(xss());

// Prevent HTTP parameter pollution, allow specific fields
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
);



// API routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/', viewRouter);

// Handle undefined routes
app.all('*', (req, res, next) => {
    next(new appError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// Export the app
module.exports = app;