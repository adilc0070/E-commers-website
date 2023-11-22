let adminModel = require('../models/adminModel')
let user = require('../models/userModel')
let ProductDB = require('../models/productModel')
let category = require('../models/catogoryModel')
let productController = require('../controller/productController')
let multer = require('../middleware/multer')
let bcrypt = require('bcrypt')
let env = require('dotenv')
env.config()
let session = require('express-session')
const Order = require('../models/orederModel');




//--------------------email validation function---------------------
function validateEmail(email) {
    const regex = /^[^\s@]+@(gmail\.com|icloud\.com|yahoo\.com)$/;
    return regex.test(email);
}

//password validation
function validatePassword(password) {
    // Password should be at least 8 characters long and contain both letters and numbers
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}


//admin login page 
let adminLogin = async (req, res) => {
    try {
        res.render('adminLogIn')
    } catch (error) {
        console.log(error.message);
    }
}

//admin logni page rendrering
let adminLogon = async (req, res) => {
    try {
        let { adminEmail, adminPassword } = req.body;
        console.log(adminEmail, adminPassword);
        let admi = await adminModel.findOne({ email: adminEmail });
        console.log(admi);
        let emailErrorMessage; // Initialize these variables
        let passwordErrorMessage ;

        if (!adminEmail || !adminPassword) {
            emailErrorMessage = 'Please Enter Email and Password';
            res.render('adminLogIn', { emailErrorMessage, passwordErrorMessage })
        } else if (!validateEmail(adminEmail)) {
            emailErrorMessage = 'Please Enter Valid Email';
            res.render('adminLogIn', { emailErrorMessage, passwordErrorMessage })
        } else if (admi==null) {
            emailErrorMessage = 'Sorry Admin not Found';
            res.render('adminLogIn', { emailErrorMessage, passwordErrorMessage })
        } else {
            let isMatch = await bcrypt.compare(adminPassword, admi.password);

            if (isMatch!=false) {
                req.session.admin_id = admi._id;
                res.redirect('/admin/dashboard');
            } else {
                passwordErrorMessage = 'Wrong Password';
                res.render('adminLogIn', { emailErrorMessage, passwordErrorMessage })
            }
        }

        // Render the EJS template with the error messages
    } catch (error) {
        // res.render('adminLogIn', { message: 'Something went wrong' });
        console.log(error.message);
    }
}
let adminRender = async (req, res) => {
    try {
        let orders = await Order.find().populate('products.productId').populate({path: 'userId', select: 'name'});
        
        
        // console.log("user:",userName.name); // Add this line
        res.render('dashboard', { orders,  });
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
}


let userManagement = async (req, res) => {
    try {
        res.render('userManagement', {
            users: await user.find()
        })
    } catch (error) {
        console.log(error.message);
    }
}

let blockuser = async (req, res) => {
    try {
        let id = req.query.id;
        let User = await user.updateOne({ _id: id }, { $set: { is_block: 1 } });

        res.redirect('/admin/userManagement')
    } catch (error) {
        console.log(error.message);
    }
}

let unblockuser = async (req, res) => {
    try {
        let id = req.query.id;
        let User = await user.updateOne({ _id: id }, { $set: { is_block: 0 } });
        res.redirect('/admin/userManagement')
    } catch (error) {
        console.log(error.message);
    }
}
let logOut = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin/login')
    } catch (error) {
        console.log(error.message);
    }
}

let addCategory = async (req, res) => {
    try {
        let categoryErrorMessage;
        let { categoryName } = req.body;
        console.log(categoryName);
        // Use a case-insensitive regular expression for the query
        let existingCategory = await category.findOne({ name: { $regex: new RegExp(categoryName, 'i') } });
        if (!existingCategory) {
            let newCategory = new category({ name: categoryName });
            await newCategory.save();
            console.log(newCategory);
            res.redirect('/admin/categoryManagement');
        } else {
            categoryErrorMessage = 'Category Already Exists';
            res.render('addCategory', { categoryErrorMessage });
        }
    } catch (error) {
        console.log(error.message);
    }
};

let categoryManagement = async (req, res) => {
    try {
        let cats = await category.find()
        // console.log(category);
        res.render('categoryManagement', { categories: cats })
    } catch (error) {
        console.log(error.message);
    }
}



let editCategory = async (req, res) => {
    try {
        let Id = req.query.id
        let categories = await category.findOne({ _id: Id })
        // console.log(categories);
        res.render('editCategory', { categories })
    } catch (error) {
        console.log(error.message);
    }
}
let editedCategory = async (req, res) => {
    try {
        let Id = req.query.id
        let { categoryName } = req.body
        let editCatErrorMessage
        let exxist = await category.findOne({ name: categoryName })
        let categories=await category.findOne({_id:Id})
        if(exxist){
            editCatErrorMessage = 'Category Already Exist'
            res.render('editCategory', { editCatErrorMessage ,categories})
        }else if(categoryName==""){
            editCatErrorMessage = 'Please Enter Category Name'
            res.render('editCategory', { editCatErrorMessage ,categories})
        }else{
            let cat = await category.updateOne({ _id: Id }, { $set: { name: categoryName } })
            res.redirect('/admin/categoryManagement')
        }
    } catch (error) {
        console.log(error.message);
    }
}

let addCatRender = async (req, res) => {
    try {
        res.render('addCategory')
    } catch (error) {
        console.log(error.message);
    }
}


let blockCategory = async (req, res) => {
    try {
        let Id = req.query.id
        let cat = await category.updateOne({ _id: Id }, { $set: { blocked: 1 } })
        res.redirect('/admin/categoryManagement')
    }
    catch (error) {
        console.log(error.message);
    }
}

let unblockCategory = async (req, res) => {
    try {
        let Id = req.query.id
        let cat = await category.updateOne({ _id: Id }, { $set: { blocked: 0 } })
        res.redirect('/admin/categoryManagement')
    }
    catch (error) {
        console.log(error.message);
    }
}



//products management page 
let productManagement = async (req, res) => {
    try {

        let products = await ProductDB.find()
        // console.log(products);


        res.render('productManagement', { products })
    } catch (error) {
        console.log(error.message);
    }
}


//==========addprodect page rendring

let productAdd = async (req, res) => {
    try {
        let categories = await category.find()
        res.render('addProduct', { categories })
    } catch (error) {
        console.log(error.message);
    }
}


//===========productadding 
const addProduct = async (req, res) => {
    try {
        console.log(req.body);
        let details = req.body;
        const files = await req.files;
        console.log(files);
        console.log(
            files.image1[0].filename,
            files.image2[0].filename,
            files.image3[0].filename,
            files.image4[0].filename
        );
        let product = new ProductDB({
            product_name: details.product_name,
            price: details.price,
            category: details.category,
            description: details.description,
            stock: details.stock,
            "images.image1": files.image1[0].filename,
            "images.image2": files.image2[0].filename,
            "images.image3": files.image3[0].filename,
            "images.image4": files.image4[0].filename,
        });

        let result = await product.save();
        //   console.log(result);
        res.redirect("/admin/productManagement");
    } catch (error) {
        console.log(error.message);
    }
};

// This Function used to Update Product , includuing Image Managment..
// ---------------------------------------
const updateProduct = async (req, res) => {
    try {
        let details = req.body;
        let imagesFiles = req.files;
        let currentData = await ProductDB.findOne({ _id: req.query.id })
        // console.log(currentData.images);

        let img1, img2, img3, img4;

        img1 = imagesFiles.image1
            ? imagesFiles.image1.filename
            : currentData.images.image1;
        img2 = imagesFiles.image2
            ? imagesFiles.image2[0].filename
            : currentData.images.image2;
        img3 = imagesFiles.image3
            ? imagesFiles.image3[0].filename
            : currentData.images.image3;
        img4 = imagesFiles.image4
            ? imagesFiles.image4[0].filename
            : currentData.images.image4;

        let update = await ProductDB.updateOne(
            { _id: req.query.id },
            {
                $set: {
                    product_name: details.product_name,
                    price: details.price,
                    frame_shape: details.frame_shape,
                    gender: details.gender,
                    description: details.description,
                    stock: details.stock,
                    "images.image1": img1,
                    "images.image2": img2,
                    "images.image3": img3,
                    "images.image4": img4,
                },
            }
        );

        //   console.log(update);

        res.redirect("/admin/productManagement");
    } catch (error) {
        console.log(error.message);
    }
};

//===============get the project editng page 
let updateProductPage = async (req, res) => {
    try {
        let categories = await category.find()
        let Id = req.query.id
        let products = await ProductDB.findOne({ _id: Id })
        res.render('editProduct', { categories, products })
    }
    catch (error) {
        console.log(error.message);
    }
}



// ==========product blocking and unblocking
let blockProduct = async (req, res) => {
    try {

        let product = await ProductDB.findOne({ _id: req.query.id })
        if (product.block == 0) {
            let cat = await ProductDB.updateOne({ _id: req.query.id }, { $set: { block: 1 } })

            res.redirect('/admin/productManagement')
        } else {
            await ProductDB.updateOne({ _id: req.query.id }, { $set: { block: 0 } })
            res.redirect('/admin/productManagement')

        }

    }
    catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    adminLogin,
    adminLogon,
    adminRender,
    userManagement,
    blockuser,
    unblockuser,
    logOut,
    categoryManagement,
    addCatRender,
    addCategory,
    editCategory,
    editedCategory,
    blockCategory,
    unblockCategory,
    productManagement,
    addProduct,
    updateProduct,
    productAdd,
    updateProductPage,
    blockProduct,

}