const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./tasks')
require('dotenv').config()

const userSchema = mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    },
    age : {
        type : Number,
        default : 0,
        validate(value) {
            if (value < 0){
                throw new Error('Age must be a postive number')
            }
        }
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        validate(value){
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password : {
        type : String,
        required : true,
        minlength : 6,
        trim : true,
        validate(password){
            // giống như password === "password"
            if(password.toLowerCase().includes('password')){
                throw new Error('Password wrong ! please try another password ')
            }
        }

    },
    avatar :{
        type : Buffer
    },
    tokens : [{
        token : {
            type : String,
            require : true
        }
    }]
},{
    timestamps : true
})

// tạo liên kết ảo với Task
userSchema.virtual('userTasks',{
    ref : 'Task', // liên kết với Task
    localField : '_id', // khóa liên kết là id
    foreignField : 'owner' // khóa ngoại của liên kết kia là owner
})

//khi nào sài this. thuộc tính thì xài methods
/////////////////// QUAN TRỌNG ////////////////////////////////
        // sử dụng methods.toJSON sẽ quyết định cách mà bạn muốn res.send hiện thị ra json như thế nào ( tất cả res.send )
/////////////////// QUAN TRỌNG ////////////////////////////////
userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject() // gán all object trong user vào userObject với toObject của mongoose

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// Create token
userSchema.methods.createAuthToken = async function() {
    const user = this
    const token = await jwt.sign({ _id : user._id.toString() }, process.env.JWT_SECRECT)

    user.tokens = user.tokens.concat({token}) // gán user.tokens có object token ghép với token vừa đc tạo
    await user.save()
    return token
}

// find User login
userSchema.statics.findByCreDentials = async (email,password) => {
    const user = await User.findOne({email})

    if(!user){
        throw new Error("Can not found your email")
    }
    
    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error("Wrong password !")
    }
    return user
}

// MiddleWare sẽ có cấu trúc userSchema.pre là trước event, và userSchema.post là sau event
// giá trị đầu tiên là hành động save, remove, validate, init...
// buộc phải sử dụng function thường, k đc sử dụng arrow function vì k bind
userSchema.pre('save', async function(next){
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next() // biến next buộc phải sử dụng để báo là middleWare đã chạy xong và tiếp tục.
    // nếu k dùng next() thì middleWare sẽ k bao giờ dừng :D 
})

// Delete user task when delete user
userSchema.pre('remove', async function(next) {
    const user = this
    await Task.deleteMany({owner : user._id})
})

// tạo Schema và sử dụng model User với Schema vừa tạo
const User = mongoose.model('User', userSchema)

module.exports = User