const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req,res,next) => {
    try {
        const token = await req.header('Authorization').replace('Bearer ', '') // get token từ header
        const decode = await jwt.verify(token, 'thisismytoken') // xác thực token vừa lấy với token trong database
        const user = await User.findOne({ _id : decode._id, 'tokens.token' : token }) 
        if(!user){
            throw new Error()
        }
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({ Error : "Please authenticate !"})
    }
}

module.exports = auth