const express = require('express')
const router = new express.Router()
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const {sendWelcomeEmail,sendRemoveEmail} = require('../email/account')


router.post('/users', async(req,res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        res.status(201).send({user}) // status 201 create done
    } catch(err) {
        res.status(400).send(err) //status 400  bad request
    }
})

router.post('/users/login', async(req,res) => {
    const email = req.body.email
    const password = req.body.password

    try {
        const user = await User.findByCreDentials(email,password)
        const token = await user.createAuthToken()
        res.send({ user,token})
    } catch(e) {
        res.status(400).send(e)
    }
})

router.get('/users', async(req,res) => {

    try  {
        const users = await User.find()
        res.send(users)
    }catch(err){
        res.status(500).send(err)
    }

})

router.get('/users/me',auth, async(req,res) => {
    res.send(req.user)
})


router.patch('/users/updateMe',auth, async (req,res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','age','email','password'] 
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({"Error" : "Field inValidOperation"})
    }

    const data = req.body
    try {
        const user = await User.findById(req.user._id)
        
        updates.forEach((update) => {
            user[update] = data[update]
        })
       
        await user.save()
        if(!user){
            res.status(404).send()
        }
        res.send(user)
    } catch(err) {
        res.status(400).send(err)
    }
})

router.delete('/users/deleteMe', auth, async(req,res) => {
    try {
        await req.user.remove()
        sendRemoveEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (err) {
        res.status(500).send(err)
    }
})

router.post('/users/logout', auth, async(req,res) => {
    res.send(req.user.tokens)
    try {
        req.user.tokens = req.user.tokens.filter((tokens) => {
            return tokens.token !== req.token 
        })
        await req.user.save()
        res.send()

    }catch(e){
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll',auth, async(req,res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }catch(e) {
        res.status(500).send(event)
    }
})

const multer = require('multer')
const upload = multer({
   
    limits : {
        fileSize : 1000000 // 1 triệu byte ~ 1mb
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/)){
            return cb(new Error('Please an images file'))
        }
        cb(undefined,true)
    }
})

// upload avatar user
router.post('/users/me/avatar', auth, upload.single('avatar'), async(req,res) => {
    const buffer = await sharp(req.file.buffer).resize({ width : 250, height : 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(err,req,res,next)=> {
    res.status(400).send({error : err.message})
})

router.delete('/users/me/avatar', auth, async(req,res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send({ Response : "Delete avatar done !" })
})

router.get('/users/:id/avatar', async(req,res) => {
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error({ err : "Cant find user or user has not avatar"})
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send(e)
    }
})

module.exports = router
