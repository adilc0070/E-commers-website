let mongoose=require('mongoose')
let adminSceama=mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true
    }
})

let admin=mongoose.model('Admin',adminSceama)
module.exports=admin