const Tour = require('./../models/tourModel')
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactory');
// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
//     );


exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.checkBody = (req, res, next) => {
    if (!req.params.body.name || !req.params.body.price) {
        return res.status(400).json({
            status: 'fail',
            message: 'Missing name or price'
        });
    }
    next();
}

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour);

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);


exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: '$difficulty',
                numTours: { $sum: 1 },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ])
    res.status(200).json({
        status: 'success',
        data: stats
    })


})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numToursStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numToursStarts: -1 }
        }
    ])
    res.status(200).json({
        status: 'success',
        data: plan
    })

})


// /tours-within/:distance/cneter/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
        return next(new appError('Please provide latitude and longitude in the format lat,lng', 400));
    }

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // Earth radius in miles or kilometers

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
                }
            }
        });

        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: { tours }
        });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
        return next(new appError('Please provide latitude and longitude in the format lat,lng', 400));
    }


    const distances = await Tour.aggregate([
        {
            $geoNear:{
                near: {
                    type: 'Point',
                    coordinates: [lng*1,lat*1]
                },
                distanceField: 'distance'
            }
        }
    ])
    res.status(200).json({
        status: 'success',
        data: { distances }
    });
})
    
