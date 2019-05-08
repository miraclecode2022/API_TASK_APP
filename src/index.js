const express = require('express')
require('./db/mongoose')
require('dotenv').config()
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT

// app.use((req,res,next) => {
//     if(req.method === 'GET')
//     {
//         res.status(503).send('method GET is blocking')
//     } else {
//         next()
//     }
    
// })

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)
 
app.listen(port, () => {
    console.log("Server Open in port " + port)
})

// const jwt = require('jsonwebtoken')

// const myFunction = async() => {
//     const token = await jwt.sign({ _id : "Abc123" }, "thisismyToken", {expiresIn : "7 days"})
//     // dữ liệu đầu tiên là để xác thực ai là người có token này ? tốt nhất là sử dụng id
//     // dữ liệu thứ 2 là key bí mật mà mình muốn tạo ra
//     console.log(token)

//     const data = await jwt.verify(token, "thisismyToken")
//     // dữ liệu xác thực đầu là token
//     // thứ 2 là chính xác key bí mật
//     console.log(data)
// }

// myFunction()


// vd toJSON
// const pet = {
//     name : "Hal",
//     age : 1
// }

// pet.toJSON = function(){
//     delete this.age
//     return pet
// }

// console.log(JSON.stringify(pet))

const Task = require('./models/tasks')

// hàm này tìm user theo owner có trong task
const main = async() => {
    const task = await Task.findById('5cd059d5df75f6341ca21b37')
    await task.populate('owner').execPopulate() // dòng này nó sẽ đi tìm user nào có liên kết với task này
    // ở đây là id user đc thêm vào owner và tham chiếu ref User rồi lấy ra thông tin
    console.log(task)
}
// main()

const User = require('./models/user')
const main2 = async() => {
    const user = await User.findById('5cd057cb24f5d41bf0072d31')
    await user.populate('userTasks').execPopulate()
    console.log(user.userTasks)
}
// main2()