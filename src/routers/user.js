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
        // const token = await user.createAuthToken() --- Khi nào muốn đăng kí xong check token vào trang chủ luôn thì tạo token 
        res.status(201).send({user}) // status 201 là create done
    } catch(err) {
        res.status(400).send(err) //status 400 là bad request
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
    const updates = Object.keys(req.body) // lấy các đối tượng field trong req.body đc nhập
    const allowedUpdates = ['name','age','email','password'] // các field cho phép thay đổi value
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update)) // updates dùng every duyệt tất cả phần tử key field
    // gán vào biến update rồi includes vào allowedUpdates để kiểm tra trùng với các field cho phép

    if(!isValidOperation){
        return res.status(400).send({"Error" : "Field inValidOperation"})
    }

    const data = req.body
    try {
        const user = await User.findById(req.user._id)

        // hàm này có nghĩa là dùng updates ở trên lấy các field thay đổi
        // sau đó gán user vừa tìm đc với tên field mà forEach updates tìm đc khi ng dùng nhập vào
        // gán bằng với các values nhập trong field (req.body) xứng với từng feild
        updates.forEach((update) => {
            user[update] = data[update]
        })
        // const user = await User.findByIdAndUpdate(_id,data, { new : true, runValidators : true})
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
        // const user = await User.findByIdAndRemove(req.user._id)
        // if(!user) {
        //     return res.status(404).send({Error : "User Not Found"})
        // }
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
            return tokens.token !== req.token // trả về array token k có req.token , giống như xóa đi vậy đó
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
    // dest : 'images', // khi để dest thì middleware này sẽ lấy dữ liệu bỏ vào , nếu k sẽ pass dữ liệu vào function để sử lí
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

// upload avatar của user
router.post('/users/me/avatar', auth, upload.single('avatar'), async(req,res) => {
    const buffer = await sharp(req.file.buffer).resize({ width : 250, height : 250}).png().toBuffer()
    // bỏ dữ liệu buffer vào sharp. Resize ảnh, convert ảnh thành png , sau đó trả về dữ liệu buffer rồi gán vào biến

    req.user.avatar = buffer // req.file.buffer sẽ giữ dữ liệu image pass từ middle và gán vào user avatar
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