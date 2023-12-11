// Import necessary modules
const user = require("../models/userModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
require("dotenv").config();
const session=require('express-session')
let Products=require('../models/productModel')
let category=require('../models/catogoryModel')
let address=require('../models/address');
const cart = require("../models/cart");


// Initialize the OTP variable
let otp = 0;
let userEmail=""
let username = "";
let userVerificationEmail=''


//home page
let homePage = async (req, res) => {
    try {
        let produ=await Products.find({block:0})
        // console.log(produ)
        let cartData
        let cat=await category.find()
        let userDa;
        if(req.session.user_id){
            userDa = await user.findById(req.session.user_id)
            cartData = await cart.findOne({ userid: req.session.user_id })
            if(userDa){
                res.render("index", { userDa,  cat, produ ,cartData});
            }else{
                // console.error();
                res.render("index", { userDa, cat, produ ,cartData});
            }
        }else{
            res.render("index", { userDa, cat , produ,cartData});
        }
    } catch (error) {
        res.status(500).send(error);
    }
}



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


//----------------------password hashing function---------------------
async function hashPassword(password) {
    try {
        const passHash = await bcrypt.hash(password, 10);
        return passHash;
    } catch (error) {
        console.log(error.message);
    }
}

//-------------insertUser function and OTP generation-----------------

async function insertUser(req, res) {
    try {

        let nameErrorMsg, emailErrorMsg, numberErrorMsg, passwordErrorMsg, confirm_password;
        let exxist = await user.findOne({ email: req.body.email });
        let writed={
            name:req.body.name,
            email:req.body.email,
            phone:req.body.phone,
            password:req.body.password
        }
        if(exxist){
            emailErrorMsg= "Email Already Exist"
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg ,confirm_password,writed});
        }else if (req.body.name === "") {
            nameErrorMsg= "Please Enter Your Name" 
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg ,confirm_password,writed});
        } else if (!validateEmail(req.body.email)) {
            emailErrorMsg= "Please Enter a Valid Email" 
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg ,confirm_password,writed});
        } else if (!/^\d+$/.test(req.body.phone) || req.body.phone.length !== 10) {
            numberErrorMsg = "Please Enter a Valid 10-digit Phone Number";
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg, passwordErrorMsg, confirm_password, writed});
        } else if(!validatePassword(req.body.password)){
            passwordErrorMsg= "Please Enter a Valid Password, at least 8 characters long and contain both letters and numbers"
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg, confirm_password, writed});

        }else if( req.body.confirm_password != req.body.password ){
            confirm_password= "Please Enter Valid Password"
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg, confirm_password, writed});

        } else {
            const passSec = await hashPassword(req.body.password);
            const newUser = new user({
                name: req.body.name,
                email: req.body.email,
                password: passSec,
                phone: req.body.phone,
                is_block: 0,
                verified: 1,
            });

            username = newUser.name;
            const userData = await user.insertMany([newUser]);

            if (userData) {
                userVerificationEmail=req.body.email
                sendVerifyMail(req.body.email);
                let otpmsg = "Please Verify Your Email";
                res.render("otp", { otpmsg });
            } else {
                res.send("Something went wrong");
            }
        }
    } catch (error) {
        res.status(500).send(error);
    }
}

//--------------signup page----------------
async function signUpPage(req, res) {
    try {
        let writed = {
            name: "",
            email: "",
            phone: "",
            password: "",
        }
        res.render("signup", { writed });
    } catch (error) {
        res.status(500).send(error);
    }
}

// Login page
async function loginPage(req, res) {
    try {
        if(!req.session.user_id){
            let writed = {
                name: "",
                email: "",
                phone: "",
                password: "",
            }
            const successMessage = req.query.msg || ''; 
            res.render('signin', { successMessage, writed });
        }else{
            res.redirect("/home")
        }
    } catch (error) {
        res.status(500).send(error);
    }
}

// Login user
async function loginUser(req, res) {
    try {
        let emailMessage = '';
        let passwordMessage = '';
        let blockMessage = '';
        let writed = {
            email:(req.body.email).trim(),
            password:req.body.password
        }

        if (req.body.email === "" || req.body.password === "") {
            emailMessage = "Please Enter Your Email";
            passwordMessage = "Please Enter Your Password";
            res.render('signin', { emailMessage, passwordMessage, blockMessage, writed });
            return;
        }

        const foundUser = await user.findOne({ email: (req.body.email).trim() });

        if (foundUser) {
            if (foundUser.verified !== 0) {
                const msg = "Please Verify Your Email";
                sendVerifyMail((req.body.email).trim());
                res.render('otp', { msg });
            } else if (!validateEmail((req.body.email).trim()) || (req.body.email).trim() === "") {
                emailMessage = "Please Enter a Valid Email";
                res.render('signin', { emailMessage, passwordMessage, blockMessage, writed });
            } else if (foundUser.is_block === 1) {
                blockMessage = "Your account is blocked";
                res.render('signin', { emailMessage, passwordMessage, blockMessage, writed });
            } else {
                const passwordMatch = await bcrypt.compare(req.body.password, foundUser.password);

                if (passwordMatch) {
                    console.log("User entered after comparing the password and email");
                    req.session.user_id = foundUser._id;
                    res.redirect("/home");
                } else {
                    passwordMessage = "Incorrect Password";
                    res.render('signin', { emailMessage, passwordMessage, blockMessage, writed });
                }
            }
        } else {
            const emailErrorMsg = "Please create an account";
            res.render('signUp', { emailErrorMsg });
        }
    } catch (error) {
        console.error("Error in loginUser:", error);
        res.status(500).send(error.message);
    }
}


// Generate OTP
function generateOtp() {
    // Generate a 6-digit OTP
    otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}
//otp ValidUpTo90Sec
let otpExpaire = async (req, res) => {
    
    setTimeout(() => {
    
        return otp = 0;
    }, 90000);
}

const sendVerifyMail = async (email) => {
    try {
        let GOTP = generateOtp();
        otp=GOTP
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465, // Use port 465 for secure connection
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "OTP Verification",
            html: `<span><p>Hey ${username}!</p></span>
            <br>
            <span><p>Your One-Time Password (OTP) is: <h4>${GOTP}</h4></span></p>
            <br>
            <p>Please use this OTP to verify your account.</p>
            <br>
            <p><b> TEAM RusticLens</b></p>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email has been sent:", info.response);
        userEmail=email;
        userVerificationEmail=email
        console.log("OTP:", GOTP, email);
        GOTP=otpExpaire();
    } catch (error) {
        console.error("Error sending email:", error.message);
    }
};

// Render OTP page
async function otpLoad(req, res) {
    try {
        console.log("otpLoad");
        let otpmsg = req.query.msg || '';
        console.log(otpmsg);
        res.render("otp" , { otpmsg });
    } catch (error) {
        res.status(500).send(error);
    }
}
//resendOtp
let resendOtp=async(req,res)=>{
    try {
        console.log("resendOtp");
        sendVerifyMail(userEmail);
        let otpmsg = "OTP sent successfully" || '';
        res.render("otp" , { otpmsg });
    } catch (error) {
        res.status(500).send(error);
    }
}

// Verify OTP
async function otpVerify(req, res) {
    try {

        let msg
        console.log(req.body.otp, otp);
        if (otp == req.body.otp) {

            let updateUser = await user.updateOne({ email: userVerificationEmail}, { $set: { verified: 0 } });
            msg = "OTP verified successfully!"; 

            // Redirect the user with the success message
            res.redirect(`/signin?msg=${encodeURIComponent(msg)}`);
        } else {
            msg = "Wrong OTP"
            res.render("otp", { msg});
        }
    } catch (error) {
        res.status(500).send(error);
    }
}

//==============logout===============
let logOut = async (req, res) => {
    if (req.session.user_id) {
        req.session.destroy();
        res.redirect("/signin");
    } else {
        res.redirect("/signin");
    }
}
let forgotPassword = (req, res) => {
    try {
        res.render("forgotPassword");
    } catch (error) {
        res.status(500).send(error);
    }
}
let resetPassword=async(req,res)=>{
    try {
        let confirm_password,passwordErrorMsg,emailErrorMsg
        let userEmail=req.body.findEmail
        let findUser=await user.findOne({email:userEmail})
        if(!validateEmail(req.body.findEmail)){
            emailErrorMsg="Email not found"
            res.render("forgotPassword",{emailErrorMsg,passwordErrorMsg,confirm_password,})
        }else if(!validatePassword(req.body.newPassword)){
            passwordErrorMsg="Pleas Enter a Valid Password, at least 8 characters and contain letters and numbers"
            res.render("forgotPassword",{emailErrorMsg,passwordErrorMsg,confirm_password,})
        }else if(req.body.newPassword!==req.body.confirmPassword){
            passwordErrorMsg="Password not matched"
            res.render("forgotPassword",{emailErrorMsg,passwordErrorMsg,confirm_password,})
        }else{
            let secPass=await hashPassword(req.body.newPassword)
            let resPass=await user.updateOne({email:userEmail},{$set:{password:secPass}})
            if(resPass){
                console.log("password updated");
                sendVerifyMail(userEmail)
                await user.updateOne({email:userEmail},{$set:{verified:1}})
                res.render("otp")
            }else{
                console.log("password not updated");
            }
        }

    } catch (error) {
        res.status(500).send(error);
    }
}
//======================show the product details==================
let productDetail = async (req, res) => {
    try {
        let Id = req.query.id
        let userDa;        
        let cartData
        let product = await Products.findOne({_id:Id})
        if(req.session.user_id){            
            cartData = await cart.findOne({ userid: req.session.user_id })
            userDa = await user.findById(req.session.user_id)
            res.render("productDetails",{product,userDa,cartData})
        }else{
            
            res.render("productDetails",{product,userDa,cartData})
        }
    } catch (error) {
        console.log(error.message);
    }
}
let productPage = async (req, res) => {
    try {
        let userDa = await user.findById(req.session.user_id);
        let catago = await category.find({ blocked: 0 });
        let cartData = await cart.findOne({ userid: req.session.user_id });
        let search = req.query.search

        // Pagination Logic
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Updated to use the custom limit
        const skip = (page - 1) * limit;
        let productCount
        let totalPages 
        if(search){
             productCount = await Products.countDocuments({ product_name: { $regex: search, $options: 'i' },block: 0 });
             totalPages = Math.ceil(productCount / limit);
        }else{
            productCount = await Products.countDocuments({ block: 0 });
            totalPages = Math.ceil(productCount / limit);
        }

        let product
        if(search){
            product = await Products.find({ product_name: { $regex: search, $options: 'i' },block: 0 }).skip(skip).limit(limit);
        }else{

            product = await Products.find({ block: 0 }).skip(skip).limit(limit);
        }
        // Sorting Logic
        let sortOption = req.query.sort;
        let sortQuery = {};

        switch (sortOption) {
            case 'Newest':
                sortQuery = { _id: -1 };
                console.log(sortQuery);
                break;
            case 'Oldest':
                sortQuery = { _id: 1 };
                console.log(sortQuery);
                break;
            case 'PriceLowToHigh':
                sortQuery = { price: 1 };
                console.log(sortQuery);
                break;
            case 'PriceHighToLow':
                sortQuery = { price: -1 };
                console.log(sortQuery);
                break;
            default:
                sortQuery = { _id: -1 };
                console.log(sortQuery);
                // Default sorting by newest
                break;
        }

        if(search){
            product = await Products.find({ product_name: { $regex: search, $options: 'i' }, block: 0 })
                .sort(sortQuery)
                .skip(skip)
                .limit(limit);
        }else{
            product = await Products.find({ block: 0 })
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);
        }
        let cattt
        // console.log(product);
        // res.json({ product, totalPages, currentPage: page });
        res.render("products", { product, userDa, catago, cartData, totalPages, currentPage: page,cattt });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

let filterProducts = async (req, res) => {
    try {
        console.log("filterProducts");
        const categoryId = req.query.categoryId; 
        let userDa = await user.findById(req.session.user_id);
        let catago = await category.find({_id: categoryId, blocked: 0 });
        let cartData = await cart.findOne({ userid: req.session.user_id });
        // Pagination Logic
        const page = parseInt(req.query.page) || 1;
        const limit = 8; 
        const skip = (page - 1) * limit;
        console.log("page",page,limit,skip);
        let cattt=catago[0].name
        // Filter products by category
        const productCount = await Products.countDocuments({ block: 0 });
        const totalPages = Math.ceil(productCount / limit);
        let product
        if(cattt){
            console.log("filterProducts category",cattt);
            product = await Products.find({block: 0 }).skip(skip).limit(limit);

        }else{
            product = await Products.find({ block: 0 }).skip(skip).limit(limit);
            log("no category")
        }

        // console.log(product);
        res.render("products", { product, userDa, catago, cartData, totalPages, currentPage: page, cattt });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

let displayFilteredProducts = async (req, res) => {
    try {
        
        const categoryId = req.query.categoryId;
        let userDa = await user.findById(req.session.user_id);
        let catago = await category.find({ blocked: 0 });
        let cartData = await cart.findOne({ userid: req.session.user_id });

        // Pagination Logic
        const page = parseInt(req.query.page) || 1;
        const limit = 8; // Number of products per page
        const skip = (page - 1) * limit;

        // Filter products by category
        const productCount = await Products.countDocuments({ category: categoryId, block: 0 });
        const totalPages = Math.ceil(productCount / limit);

        const product = await Products.find({ category: categoryId, block: 0 }).skip(skip).limit(limit);

        res.render("filteredProducts", { product, userDa, catago, cartData, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};
let Order=require("../models/orederModel");
const { render } = require("../router/userRoute");
const { log } = require("winston");
let userProfile=async(req,res)=>{
    try {

        let userDa=await user.findById(req.session.user_id)
        let deliveredOrders=await Order.find({userId:req.session.user_id,status:"delivered"}).sort({date:-1})
        let pendingOrders=await Order.find({userId:req.session.user_id,status:{ $in: ["pending", "shipped"] }}).sort({date:-1})        
        res.render("profilePage",{userDa,deliveredOrders,pendingOrders})
    } catch (error) {
        console.log(error.message);
    }
}
let editProfile=async(req,res)=>{
    try {
        let userDa=await user.findById(req.session.user_id)

        res.render("dashChanges",{userDa})
    } catch (error) {
        console.log(error.message);
    }
}


let updateProfile=async(req,res)=>{
    try {
        let userDa=await user.findById(req.session.user_id)
        let prePassword=userDa.password
        let newProfile
        if(req.files[0]){
            newProfile=req.files[0].filename
        }else{
            newProfile=userDa.profile
        }
        let newName=req.body.username
        let newEmail= req.body.useremail
        let newPassword=req.body.userpassword 
        let newPhone=req.body.usernumber
        
        
        if(newName=='' || newEmail=='' || newPhone==''){
            console.log("empty");
            res.render("dashChanges",{userDa})
        }else if(!validateEmail(newEmail)){
            console.log("invalid email");
            res.render("dashChanges",{userDa})
        }else if(!newPhone.length==10){
            console.log("invalid number");
            res.render("dashChanges",{userDa})
        }else{
            console.log("valid");
            if(newPassword==''){
                console.log("no password");
                newPassword=prePassword
            }else{
                console.log("password");
                if(!validatePassword(newPassword)){
                    console.log("invalid password");
                    res.render("dashChanges",{userDa})
                }else{
                    newPassword=await hashPassword(newPassword)
                }
                console.log("updated");
            }
            let update=await user.updateOne({_id:req.session.user_id},{
                name:newName,
                email:newEmail,
                password:newPassword,
                profile:newProfile,
                number:newPhone
            })
            res.redirect("/profile")
        }
    } catch (error) {
        console.log(error.message);
    }
}   

let addressPage = async (req, res) => {
    try {

        let userDa = await user.findById(req.session.user_id);
        let cartData = await cart.findOne({ userid: req.session.user_id })

        let addresses = await address.find({ user: req.session.user_id });

        res.render("address", { userDa, addresses, cartData });
    } catch (error) {
        console.log(error.message);
    }
};

let addAddressPage = async (req, res) => {
    try {
        let cartData = await cart.findOne({ userid: req.session.user_id });
        let userDa = await user.findById(req.session.user_id);
        res.render("addAddress", { userDa, cartData });
    } catch (error) {
        console.log(error.message);
    }
}


let insertAddress = async (req, res) => {
    try {
        let userDa = await user.findById(req.session.user_id);
        let cartData = await cart.findOne({ userid: req.session.user_id })


        // Assuming your form fields are named firstName, lastName, address, city, state, pin, country, phone, email, additionalDetails
        let newAddress = new address({
            user: req.session.user_id,
            addresses: [{
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                pin: req.body.pin,
                country: req.body.country,
                phone: req.body.phone,
                email: req.body.email,
                additional: req.body.additionalDetails,
            }]
        });

        await newAddress.save();

        res.redirect("/address");
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
};

let editAddressPage = async (req, res) => {
    try {
      console.log('Reached editAddressPage route');
      let errors = [];
      let userDa = await user.findById(req.session.user_id);
      let cartData= await cart.findOne({ userid: req.session.user_id })
      
      let id = req.query.id;
      let addressData = await address.find({ "addresses._id": id });
    //   console.log("addresses", addressData);
      let addresses=addressData[0].addresses[0]
    //   console.log("addresses", addresses);
      res.render("editAddress", { userDa, id ,cartData, addresses, errors });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
  


let editAddress = async (req, res) => {
  try {
    let addresses = await address.find({ user: req.session.user_id });
    let userDa = await user.findById(req.session.user_id);
    let cartData= await cart.findOne({ userid: req.session.user_id })
    let edit = req.query.id;
    console.log("edit", edit);
    console.log("user addresses", addresses);
    if (edit) {
        console.log("edit");
      let addresss = await addresses.find({ "addresses._id": edit });
      console.log("edit address", addresss);
      let {
        firstName,
        lastName,
        address,
        city,
        state,
        pin,
        country,
        phone,
        email,
        additional,
      } = addresss;

      // Validation checks
      let errors = [];

      if (!firstName) {
        errors.push("First name is required.");
      }

      if (!lastName) {
        errors.push("Last name is required.");
      }

      if (!address) {
        errors.push("Address is required.");
      }

      if (!city) {
        errors.push("City is required.");
      }

      if (!state) {
        errors.push("State is required.");
      }

      if (!pin) {
        errors.push("Zip code is required.");
      } else if (!/^\d{5}$/.test(pin)) {
        errors.push("Invalid zip code format. It should be 5 digits.");
      }

      if (!country) {
        errors.push("Country is required.");
      }

      if (!phone) {
        errors.push("Phone number is required.");
      } else if (!/^\d{10}$/.test(phone)) {
        errors.push("Invalid phone number format. It should be 10 digits.");
      }

      if (!email) {
        errors.push("Email is required.");
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.push("Invalid email format.");
      }

      if (errors.length > 0) {
        // If there are validation errors, render the view with the errors
        res.render("editAddress", { userDa, addresss, errors, cartData });
      } else {
        // All validations passed, proceed with updating the address
        await address.updateOne(
          { "addresses.$._id": edit },
          {
            $set: {
              "addresses.$.firstName": req.body.editFirstName,
              "addresses.$.lastName": req.body.editLastName,
              "addresses.$.address": req.body.editAddress,
              "addresses.$.city": req.body.editCity,
              "addresses.$.state": req.body.editState,
              "addresses.$.pin": req.body.editPin,
            //   "addresses.country": req.body.editCountry,
              "addresses.$.phone": req.body.editPhone,
              "addresses.$.email": req.body.editEmail,
              "addresses.$.additional": req.body.editAdditional,
            },
          }
        );

        // Redirect to the address page after successful update
        res.redirect("/editaddress?id=" + edit);
      }
    } else {
      // Handle the case where edit query parameter is not provided
      res.render("editAddress", { userDa, error: "Invalid request." ,cartData, addresses });
    }
  } catch (error) {
    console.log(error.message);
  }
};




let deleteAddress = async (req, res) => {
    try {
        let addressId = req.query.id;
        let deletedAddress = await address.findOneAndDelete({ "addresses._id": addressId });
        res.redirect("/address");
    } catch (error) {
        console.log(error.message);
    }
};


// product and catogory search
let searchitems = async (req, res) => {
    try {
        let userDa = await user.findById(req.session.user_id);
        let catago = await category.find({ blocked: 0 });
        let cartData = await cart.findOne({ userid: req.session.user_id });
        let search = req.query.search;
        // Pagination Logic
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Updated to use the custom limit
        const skip = (page - 1) * limit;

        const productCount = await Products.countDocuments({ block: 0 });
        const totalPages = Math.ceil(productCount / limit);

        let product = await Products.find({ block: 0 }).skip(skip).limit(limit);
        // Sorting Logic
        let sortOption = req.query.sort;
        let sortQuery = {};

        switch (sortOption) {
            case 'Newest':
                sortQuery = { _id: -1 };
                console.log(sortQuery);
                break;
            case 'Oldest':
                sortQuery = { _id: 1 };
                console.log(sortQuery);
                break;
            case 'PriceLowToHigh':
                sortQuery = { price: 1 };
                console.log(sortQuery);
                break;
            case 'PriceHighToLow':
                sortQuery = { price: -1 };
                console.log(sortQuery);
                break;
            default:
                sortQuery = { _id: -1 };
                console.log(sortQuery);
                // Default sorting by newest
                break;
        }

        product = await Products.find({ block: 0 })
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);
        if(search){
            product = await Products.find({ block: 0, name: { $regex: search, $options: 'i' } })
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);
        }
        
        res.render("products", { product, userDa, catago, cartData, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

let walletPage = async (req, res) => {
    try {
        let userDa = await user.findById(req.session.user_id);
        let cartData = await cart.findOne({ userid: req.session.user_id });
        res.render("wallet", { userDa, cartData });
    } catch (error) {
        console.log(error.message);
        // Handle the error appropriately, e.g., send an error response
        res.status(500).send('Internal Server Error');
    }
}


// Export the functions
module.exports = {
    insertUser,
    signUpPage,
    loginPage,
    loginUser,
    otpLoad,
    otpVerify,
    homePage,
    logOut,
    productDetail,
    resendOtp,
    forgotPassword,
    resetPassword,
    productPage,
    userProfile,
    editProfile,
    addressPage,
    addAddressPage,
    insertAddress,
    deleteAddress,
    editAddress,
    editAddressPage,
    searchitems,
    filterProducts,
    displayFilteredProducts,
    updateProfile,
    walletPage
};
