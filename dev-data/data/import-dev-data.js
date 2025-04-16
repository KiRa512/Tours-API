const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');
const { dirname } = require('path');


dotenv.config({ path: './config.env' });
//console.log(process.env);

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true, // to remove deprecation warning
    useFindAndModify: false, // to remove deprecation warning
}).then(con => {
    //console.log(con.connections);
    console.log('DB connection successful');
})

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

const importData = async () => {
    try {
        //await Tour.create(tours);
        await User.create(users,{validateBeforeSave: false});
        //await Review.create(reviews);
        console.log('Imported Successfully')
    } catch (err) {
        console.log(err)
    }
    process.exit();
}

const deleteData = async () => {
    try {
        //await Tour.deleteMany();
        await User.deleteMany(); 
        //await Review.deleteMany();
        console.log('Deleted Successfully')
    } catch (err) {
        console.log(err)
    }
    process.exit();
} 



if (process.argv[2] === '--import'){
    importData();
}

else if (process.argv[2] === '--delete'){
    deleteData();
}


