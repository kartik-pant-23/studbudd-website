const mongoose = require("mongoose");

const connectDB = async () => {
    const conn = await mongoose.connect(
        process.env.MONGO_URI,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true
        }
    ).then(_ => {
        console.log('Database connection successful!')
    })
    .catch(err=>{
        console.log('Database connection failed!')
        console.error(err.message);
    })
}

module.exports = connectDB;