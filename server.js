const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', err =>{
  console.log(err.name , err.message);
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  process.exit(1);
}); 


const app = require('./app');

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
}).then(con=>{
 // console.log(con.connections);
  console.log('DB connection successful');
})

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 

process.on('unhandledRejection', err =>{
  console.log(err.name , err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(()=>{
    process.exit(1);
  });
}); 


//console.log(x);
