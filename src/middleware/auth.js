const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req,res,next) => {
    try {
        const token = await req.header('Authorization').replace('Bearer ', '') 
        const decode = await jwt.verify(token, process.env.JWT_SECRECT) 
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
