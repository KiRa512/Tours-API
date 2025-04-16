const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactory');
const sharp = require('sharp');
const multer = require('multer');


// const multerStorage = multer.diskStorage({
//     destination: (req,file,cb)=>{
//         cb(null,'public/img/users');
//     },
//     filename: (req , file , cb)=>{
//         // user-123456789-32566464.jpg
//         const ext = file.mimetype.split('/')[1];
//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// })

const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true)
    }
    else{
        cb(new appError('Please upload an image',400),false)
    }
}
const upload = multer({
    storage:multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');
exports.resizePhoto = (req,res,next)=>{
    if(!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    sharp(req.file.buffer)
        .resize(500,500)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/users/${req.file.filename}`)

    next()


};


const filterObj = (obj, ...allowedFields) => {      // it takes 2 args the obj and the allowd field to remove the rest
    const newObj = {}              // add the allowdFields 
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};


exports.updateUser = (req,res)=>{
    res.status(404).json({
        status: 'fail',
        message: 'This route is not yet defined'
    })
}

exports.updateMe = catchAsync(async(req , res , next)=>{
    if(req.body.password || req.body.confirmPassword){
        return next(new appError('This current route is not for password update',400));
    }
    const filteredBody = filterObj(req.body , 'name','email');
    if(req.file) filteredBody.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(req.user.id , filteredBody,{
        new: true,
        runValidators:true
    })
    res.status(200).json({
        status: 'success',
        data:{
            user: updatedUser
        }
    })
});

exports.deleteMe = catchAsync(async(req , res , next)=>{
    await User.findByIdAndUpdate(req.user.id , {active: false});
    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.createUser = (req,res)=>{
    res.status(404).json({
        status: 'fail',
        message: 'Please use sign up instead'
    })
}
exports.getMe = (req,res,next) => {
    req.params.id = req.user.id;
    next();
}
exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User)
