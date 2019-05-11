const express = require('express')
const router = new express.Router()
const Task = require('../models/tasks')
const auth = require('../middleware/auth')

// POST task
router.post('/tasks',auth, async(req,res) => {
    const task = new Task({
        ...req.body,
        owner : req.user._id
    })

    try{
        await task.save()
        res.status(201).send(task)
    } catch(err){
        res.status(400).send(err)
    }

})

// GET all Task
// pagination /tasks?limit=2&skip=2
router.get('/tasks',auth, async(req,res) => {
    const match = {}
    const sort = {}
    try {
        if(req.query.completed){
            match.completed = req.query.completed === 'true'
        }
        if(req.query.sortBy){
            const parts = req.query.sortBy.split(':')
            console.log(parts);
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }

        await req.user.populate({
            path : 'userTasks',
            match,
            options : {
                limit : parseInt(req.query.limit), 
                skip : parseInt(req.query.skip),  
                sort : {
                   // createdAt : -1 // sort theo thời gian 
                   completed : -1
                }
            }
            
        }).execPopulate() 
        res.send(req.user.userTasks)
    } catch (err) {
        res.status(500).send(err)
    }

})

// GET task by id user
router.get('/tasks/:id',auth, async(req,res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, owner : req.user._id })

        if(!task){
            res.status(404).send()
        }
        res.send(task)
    } catch (err) {
        res.status(500).send(err)
    }

})

// PATCH Task
router.patch('/tasks/:id',auth, async(req,res) => {
    const updates = Object.keys(req.body)
    const allowedUpdate = ["description", "completed"]
    const isValidOperation = updates.every((update) => allowedUpdate.includes(update))
    if(!isValidOperation){
        return res.status(400).send({"Error" : "Feild isValidOperation" })
    }
    const _id = req.params.id
    const data = req.body
    try {
        const task = await Task.findOne({ _id, owner : req.user._id})
        
        if(!task){
            return res.status(404).send({ Error : "Task Not Found"})
        }
        updates.forEach((update) => {
            task[update] = data[update]
        })

        await task.save()
        res.send(task)
    } catch (err){
        res.status(400).send(err)
    }
})

// DELETE Task
router.delete('/tasks/:id',auth, async(req,res) => {
    const _id = req.params.id
    try{
        const task = await Task.findOneAndRemove({_id, owner : req.user._id})
        if(!task){
            return res.status(404).send({Error : "Task Not Found"})
        }
        res.send(task)
    }catch(err){
        res.status(500).send(err)
    }
})

module.exports = router
