
const product = require('../models/productModel')

let productManagement=async(req,res)=>{
    try {

        let products=await product.find()
        
        res.render('productManagement',{products})
    } catch (error) {
        console.log(error.message);
    }
}


