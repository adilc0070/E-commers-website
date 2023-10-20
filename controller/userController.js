let user = require('../models/userModel');
let nodeMailer = require('nodemailer');
require('dotenv').config()
var otp=0
function validateEmail(email) {
    const regex = /^[^\s@]+@(gmail\.com|icloud\.com|yahoo\.com)$/;
    return regex.test(email);
}


let insertUser = async (req, res) => {
    try {
        if (!validateEmail(req.body.email)) {
            res.render('signup',{msg:"Please Enter Valid Email"})
        }else{
            console.log("hi");
            let newUser = new user({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                phone: req.body.phone,
                is_block: 0
            })
            console.log(newUser);
            let userData=await user.insertMany([newUser])
            if(userData){
                console.log("otp render");
                generateOtp()
                res.render('otp')
            }else{
                res.send('kernilla')
            }
        }
    } catch (error) {
        res.status(500).send(error)
    }
}


let signUpPage = async (req, res) => {
    try {

        res.render('signup')
    } catch (error) {
        res.status(500).send(error)
    }
}

let loginPage = async (req, res) => {
    try {
        res.render('signIn')
    } catch (error) {
        res.status(500).send(error)
    }
}

let loginUser = async (req, res) => {
    try {
        let user = await user.findOne({ email: req.body.email, password: req.body.password })
        if (user != false) {
            res.render('otp')
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        res.status(500).send(error)
    }
}

function generateOtp() {
    otp=Math.floor(100000 + Math.random() * 999999)
    console.log(otp);
}

// const sendVerifyMail = async (email, otp) => {
//     try {
//       const transporter = nodemailer.createTransport({
//         host: "smtp.gmail.com",
//         port: 587,
//         secure: false,
//         requireTLS: true,
//         auth: {
//           user: "process.env.EMAIL",
//           pass: "process.env.PASSWORD",
//             },
//     })0
//     } catch (error) {
    
// }}



let sentOtp=async(req,res)=>{
    try {
        
    } catch (error) {
        
    }
}
let otpLoad = async (req, res) => {
    try {
        res.render('otp')
    } catch (error) {
        res.status(500).send(error)
    }
}

let otpVerify = async (req, res) => {
    try {
        if(otp==req.body.otp){
            res.redirect('/signin')
        }else{
            res.render('otp',{msg:"Invalid OTP"})
        }
    } catch (error) {
        res.status(500).send(error)
    }
}

module.exports = {
    insertUser,
    loginPage,
    signUpPage,
    loginUser,
    otpLoad,
    otpVerify,
}