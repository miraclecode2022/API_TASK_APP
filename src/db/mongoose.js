const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser : true,
    useCreateIndex : true,
    useFindAndModify : false // ẩn warning của hàm findByIdAndUpdate
}, (error) =>{
    if(error){
        console.log("Can't Connect")
    }
    console.log("Connected to Database !")
})
