const mongoose = require('mongoose');
const slug = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        maxlength: [40, 'A tour name must have less or equal than 40 characters'],
        minlength: [5, 'A tour name must have more or equal than 5 characters'],
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A trip must have a duration']
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: (val) => Math.round(val*10)/10
    },

    price: {
        type: Number,
        required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below the regular price'
        }
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A trip must have a Group Size']
    },
    difficulty: {
        type: String,
        required: [true, 'A trip must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }

    },
    ratingQuantity: {
        type: Number,
    },

    secretTour: {
        type: Boolean,
        default: false
    },
    summary: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    startDates: [Date],
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,

    },
    locations: [{
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,

    }],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        }
    ],


}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
tourSchema.index({ price: 1,ratingsAverage: -1 });
tourSchema.index({slug:1});

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});



// ? Query Middleware
// tourSchema.pre(/^find/,function(next){
//     this.find({secretTour: {$ne: true}});
//     this.start = Date.now();
//     next();
// });

// tourSchema.post(/^find/,function(docs,next){
//     console.log(`Query took ${Date.now() - this.start} milliseconds`);
//     console.log(docs);
//     next();
// });

// ? Document Middleware: runs before .save() and .create()
tourSchema.pre('save',function(next){
    this.slug = slug(this.name, {lower: true});
    next();
});

// tourSchema.post('save',function(doc , next){
//     console.log(doc);
//     next();
// });
// tourSchema.pre('save',async function(next){
//     const guidesPromises = this.guides.map(async id => await User.findById(id)) 
//     this.guides = await Promise.all(guidesPromises);
//     next();
// })
//  Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
//     next();
// });

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'

    });
    next();
})

// Geospatial index

// Create 2dsphere indexes for geospatial queries
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.index({ locations: '2dsphere' });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;


