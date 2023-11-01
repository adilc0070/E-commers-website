// Import necessary modules
const user = require("../models/userModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
require("dotenv").config();
const session=require('express-session')
let Products=require('../models/productModel')
let category=require('../models/catogoryModel')


// Initialize the OTP variable
let otp = 0;
let userEmail=""
let username = "";


//home page
let homePage = async (req, res) => {
    try {
        let produ=await Products.find()
        // console.log(produ)
        let cat=await category.find()
        let userDa;
        if(req.session.user_id){
            userDa = await user.findById(req.session.user_id)
            if(userDa){
                res.render("index", { userDa,  cat, produ });
            }else{
                console.error();
                res.render("index", { userDa, cat, produ });
            }
        }else{
            res.render("index", { userDa, cat , produ});
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
                verified: 0,
            });

            username = newUser.name;
            const userData = await user.insertMany([newUser]);

            if (userData) {
                
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
        console.log(foundUser);
        if(foundUser){
            if(!validateEmail(req.body.email)||req.body.email==""){
                emailMessage="Please Enter a Valid Email"
                console.log("error");
                res.render('signin',{emailMessage,passwordMessage,blockMessage});
            }else if(foundUser.is_block==1){
                console.log("error");
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
                        console.log("asdfasrew");
                        req.session.user_id = foundUser._id;
                        res.redirect("/home");

                    }
                    else {
                        console.log("error");
                        res.redirect("/signin");
                    }
                })
            }
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

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587, // Gmail SMTP port for SSL
            secure: false,
            requireTLS: true, // Use SSL
            auth: {
                user: "adilc0070@gmail.com", // Your Gmail email address
                pass: "pzgx grjb wprt ijav", // Your Gmail application-specific password
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
        let product = await Products.findOne({_id:Id})
        if(req.session.user_id){
            userDa = await user.findById(req.session.user_id)
            res.render("productDetails",{product,userDa})
        }else{
            userDetails = await user.findById(req.session.user_id)
            res.render("productDetails",{product,userDa})
        }
    } catch (error) {
        console.log(error.message);
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
    resetPassword
};
