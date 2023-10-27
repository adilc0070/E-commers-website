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
let username = "";
async function insertUser(req, res) {
    try {
        if (req.body.name === " ") {
            res.render("signup", { nameErrorMsg: "Please Enter Your Name" });
        } else if (!validateEmail(req.body.email)) {
            res.render("signup", { emailErrorMsg: "Please Enter a Valid Email" });
        } else {
            const passSec = await hashPassword(req.body.password);
            const newUser = new user({
                name: req.body.name,
                email: req.body.email,
                password: passSec,
                phone: req.body.phone,
                is_block: 0,
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
        console.log("entered");
        const foundUser = await user.findOne({
            email: req.body.email
        });
        console.log(foundUser);
        if(foundUser){
            if(!validateEmail(req.body.email)){
                console.log("error");
                res.redirect("/signin")
            }else {
            
                console.log(req.session);
                bcrypt.compare( req.body.password,foundUser.password, (err, result) => {
                    console.log(result);
                    if(err){
                        res.render('signin',{message:'Something went wrong'})
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
    otp = Math.floor(100000 + Math.random() * 900000);
    console.log(otp);
    return otp;
}

// Send email with OTP
const sendVerifyMail = async (email) => {
    try {
        let GOTP = generateOtp();
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailoptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "OTP Verification",
            html: `<p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Hello, <span style="color: #ff6600; font-weight: bold;">${username}</span>,</p>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Your One-Time Password (OTP) is: <span style="color: #ff6600; font-weight: bold; font-size: 20px;">${GOTP}</span></p>
            <br>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Please click the button below to verify your OTP:</p>
            <br><br>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Warm regards,</p>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #ff6600; font-weight: bold;">TEAM RusticLens</p>
            `,
            //<a href="http://localhost:9100/signup/" style="display: inline-block; padding: 10px 20px; background-color: #ff6600; color: #fff; text-decoration: none; font-family: Arial, sans-serif; font-size: 16px;">Verify OTP</a>
            
        };

        const info = await transporter.sendMail(mailoptions);
        console.log("Email has been sent:", info.response);
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

// Verify OTP
async function otpVerify(req, res) {
    try {
        if (otp == req.body.otp) {
            res.redirect("/signin");
        } else {
            res.render("otp", { msg: "Invalid OTP" });
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
};
