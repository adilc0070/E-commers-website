let mongoose = require('mongoose');
let address=mongoose.Schema({
    user:{
        ref:'user',
        type:mongoose.Schema.Types.ObjectId,
        required:true,

    },address:{
        type:String,
        required:true
    },city:{
        type:String,
        required:true
    },state:{
        type:String,
        required:true
    },pin:{
        type:String,
        required:true
    },country:{
        type:String,

    },phone:{
        type:String,
        required:true
    },email:{
        type:String,
        required:true
    },additional:{
        type:String

    }
})


let addressModel=mongoose.model('address',address)

module.exports=addressModel