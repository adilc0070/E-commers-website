let mongoose=require('mongoose')
let productSchema = new mongoose.Schema({
    productname:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    price:{
         type:Number,
         required:true
    },
    category:{
        type:String,
        required:true
    },
    image: {
        type: [Object],
        required: true
    },
    additionalInfo:{
        type:String,
        required:true
    },
    blocked:{
        type:Number,
        default:0
    }

   
})
let product = mongoose.model("product", productSchema);
module.exports = product;