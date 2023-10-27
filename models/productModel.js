let mongoose=require('mongoose')
const productSchema = mongoose.Schema({
    product_name:{
        type:String,
        require:true
    },
    price:{
        type:Number,
        require:true
    },
    category:{
        type:String,
        require:true
    },
    description:{
        type:String,
        require:true
    },
    stock:{
        type:Number,
        require:true
    },
    images:{
        image1:{
            type:String,
            require:true
        },
        image2:{
            type:String,
            require:true
        },
        image3:{
            type:String,
            require:true
        },
        image4:{
            type:String,
            require:true
        }
    },
    block:{
        type:Number,
        default:0
    }
})

let product = mongoose.model("product", productSchema);
module.exports = product;