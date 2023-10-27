// // const admin = require('../models/adminModel')
// const user = require('../models/userModel')
// const category = require("../models/categoryModel");
const product = require('../models/productModel')
// // const multer = require("../middleware/multer");

let productManagement=async(req,res)=>{
    try {

        let products=await product.find()
        
        res.render('productManagement',{products})
    } catch (error) {
        console.log(error.message);
    }
}


