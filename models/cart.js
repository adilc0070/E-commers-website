let mongoose = require('mongoose');
let cart=mongoose.Schema({
    user:{
        ref:'users',
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },product:{
        ref:'products',
        type:mongoose.Schema.Types.ObjectId,
        required:true

    },quantity:{
        type:Number,
        required:true,
        default:1
    },price:{
        type:Number,
        required:true
    },
    
})