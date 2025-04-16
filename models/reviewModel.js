const mongoose = require('mongoose');
const Tour = require('./tourModel');
const appError = require('../utils/appError');
const reviewSchema = mongoose.Schema({
    review: String,
    rating: {
        type:Number,
        min:1,
        max:5,
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    tour:{
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
reviewSchema.index({tour:1,user:1},{unique:true})

reviewSchema.pre(/^find/, function(next){
    this.populate({
        path: 'user',
        select: 'name photo'
    }).populate({
        path: 'tour',
        select: 'name'
    });
    next();
})

reviewSchema.statics.calcAvgRating = async function(tourId){
    console.log(tourId);
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRatings: {$sum:1},
                avgRating: {$avg: '$rating'}
            }
        }
    
    ])
    console.log(stats);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: 0,
            ratingsAverage: 4.5 // Default rating or you can set it to 0 based on your preference
        });
    }
        
} 

reviewSchema.post('save',function() {
    this.constructor.calcAvgRating(this.tour);

})

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.doc = await this.findOne();  // Store the document in `this.doc` 
    console.log(this.doc);
    next();
});

// Post-middleware: Use `doc` directly to call `calcAvgRating`
reviewSchema.post(/^findOneAnd/, async function (doc) {
    if (!doc) return; // Ensure doc exists
    await doc.constructor.calcAvgRating(doc.tour);
});


// Prevent duplicate reviews
reviewSchema.pre('save',async function(next){
    const existingReview = await this.constructor.findOne({
        tour: this.tour,
        user: this.user
    })
    if (existingReview){
        return next(new(appError('You have already reviewed this tour',400)))
    }
    next();
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;