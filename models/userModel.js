let mongoose = require('mongoose');
let userSceama=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    is_block:{
        type:Boolean,
        default:0
    }
})
mongoose.model('user',userSceama);

module.exports=userSceama