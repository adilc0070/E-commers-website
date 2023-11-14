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
        let produ=await Products.find()
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
        if(exxist){
            emailErrorMsg= "Email Already Exist"
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg ,confirm_password});
        }else if (req.body.name === "") {
            nameErrorMsg= "Please Enter Your Name" 
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg ,confirm_password});
        } else if (!validateEmail(req.body.email)) {
            emailErrorMsg= "Please Enter a Valid Email" 
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg ,confirm_password});
        } else if (!/^\d+$/.test(req.body.phone) || req.body.phone.length !== 10) {
            numberErrorMsg = "Please Enter a Valid 10-digit Phone Number";
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg, passwordErrorMsg, confirm_password });
        } else if(!validatePassword(req.body.password)){
            passwordErrorMsg= "Please Enter a Valid Password, at least 8 characters long and contain both letters and numbers"
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg, confirm_password});

        }else if( req.body.confirm_password != req.body.password ){
            confirm_password= "Please Enter Valid Password"
            res.render("signup", { nameErrorMsg, emailErrorMsg, numberErrorMsg ,passwordErrorMsg, confirm_password});

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
                res.render("otp");
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
        res.render("signup");
    } catch (error) {
        res.status(500).send(error);
    }
}

// Login page
async function loginPage(req, res) {
    try {
        if(!req.session.user_id){
            res.render("signIn");
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
        let msg=''
        let emailMessage=''
        let passwordMessage=''
        let blockMessage=''
        if (req.body.email === "" || req.body.password === "") {
            emailMessage = "Please Enter Your Email"
            passwordMessage = "Please Enter Your Password"
            res.render('signin',{emailMessage,passwordMessage,blockMessage});
        }
        const foundUser = await user.findOne({
            email: req.body.email
        });
        // console.log(foundUser);
        if(foundUser){
            if(foundUser.verified!=0){
                msg="Please Verify Your Email"
                sendVerifyMail(req.body.email);
                res.render('otp',{msg});
            }else if(!validateEmail(req.body.email)||req.body.email==""){
                emailMessage="Please Enter a Valid Email"
                // console.log("error");
                res.render('signin',{emailMessage,passwordMessage,blockMessage});
            }else if(foundUser.is_block==1){
                // console.log("error");
                blockMessage="Your account is blocked"
                res.render('signin',{emailMessage,passwordMessage,blockMessage});

            }else {
            
                // console.log(req.session);
                bcrypt.compare( req.body.password,foundUser.password, (err, result) => {
                    // console.log(result);
                    if(err){
                        passwordMessage = "Something went wrong"
                        res.render('signin',{emailMessage,passwordMessage,blockMessage})
                        console.log("error on comparing the password"+err);
                    }else if(result){
                        console.log("user enter afeter comparing the password and email"  );
                        req.session.user_id = foundUser._id;
                        res.redirect("/home");

                    }
                    else {
                        console.log("error");
                        res.redirect("/signin");
                    }
                })
            }
        }else if(!foundUser){
            let emailErrorMsg="please create an account"
            res.render('signUp',{emailErrorMsg});
        }
        // if {
        //     res.redirect("/login");
        // }
    } catch (error) {
        res.status(500).send(error);
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
        
        res.render("otp");
    } catch (error) {
        res.status(500).send(error);
    }
}
//resendOtp
let resendOtp=async(req,res)=>{
    try {
        console.log("resendOtp");
        sendVerifyMail(userEmail);
        res.render("otp");
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
            
            res.redirect("/signin");
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
        let cartData = await cart.findOne({ userid: req.session.user_id })
        let product = await Products.find({ block: 0 });
        res.render("products", { product, userDa, catago, cartData });
    } catch (error) {
       console.log(error.message);
       // Handle the error appropriately, e.g., send an error response
       res.status(500).send('Internal Server Error');
    }
 }
 

let userProfile=async(req,res)=>{
    try {

        let userDa=await user.findById(req.session.user_id)
        res.render("profilePage",{userDa})
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

let cartPage=async(req,res)=>{
    try {
        let userDa=await user.findById(req.session.user_id)
        res.render("cart",{userDa})
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
      let addresses = await address.find({ user: req.session.user_id });
      let userDa = await user.findById(req.session.user_id);
      let cartData= await cart.findOne({ userid: req.session.user_id })

      let id = req.query.id;
      res.render("editAddress", { userDa, id ,cartData});
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

    if (edit) {
      let addresss = await address.findOne({ "addresses._id": edit });
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
          { "addresses._id": edit },
          {
            $set: {
              "addresses.$.firstName": req.body.firstName,
              "addresses.$.lastName": req.body.lastName,
              "addresses.$.address": req.body.address,
              "addresses.$.city": req.body.city,
              "addresses.$.state": req.body.state,
              "addresses.$.pin": req.body.pin,
              "addresses.$.country": req.body.country,
              "addresses.$.phone": req.body.phone,
              "addresses.$.email": req.body.email,
              "addresses.$.additional": req.body.additional,
            },
          }
        );

        // Redirect to the address page after successful update
        res.redirect("/edit-address?id=" + edit);
      }
    } else {
      // Handle the case where edit query parameter is not provided
      res.render("editAddress", { userDa, error: "Invalid request." ,cartData});
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


let checkoutPage = async (req, res) => {
    try {
        let cartData = await cart.findOne({ userid: req.session.user_id });
        let userDa = await user.findById(req.session.user_id);
        let addresses = await address.find({ user: req.session.user_id });

        res.render("checkout", { userDa, addresses, cartData });
    } catch (error) {
        console.log(error.message);
    }
};

// product and catogory search
let searchitems = async (req, res) => {
    try {
        let search = req.body.search;
        let userDa = await user.findById(req.session.user_id);
        let cartData = await cart.findOne({ userid: req.session.user_id });
        let product = await Products.find({ name: { $regex: search, $options: "i" } });
        let catago = await category.find({ name: { $regex: search, $options: "i" } });
        res.render("products", { product, userDa, catago, cartData });
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
    cartPage,
    addressPage,
    addAddressPage,
    insertAddress,
    deleteAddress,
    editAddress,
    editAddressPage,
    checkoutPage,
    searchitems
};
