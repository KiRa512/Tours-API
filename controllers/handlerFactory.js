const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const { modelName } = require('../models/userModel');
const { populate } = require('../models/reviewModel');
const apiFeature = require('./../utils/apiFeatures');




exports.deleteOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc){
        return next(new appError('No document found with that ID', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null
    })
})



exports.updateOne = (Model) => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!doc){
        return next(new appError('No document found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            [Model.modelName] : doc
        }
    })
})


exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            tour: doc
        }
    })
})

exports.getOne = (Model , popOptions)=> catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    if(popOptions) query = query.populate(popOptions);
    const doc = await query
    if (!doc){
        return next(new appError('No document found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            datas:doc
        }
    });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // to allow for nested get reviews
    let filter = {};
    if (req.params.tourId) filter = {tour: req.params.tourId};
    // EXECUTE QUERY
    const features = new apiFeature(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data: doc
        }
    });
});
    

