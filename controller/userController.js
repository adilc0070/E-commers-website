let user = require('../models/userModel');
let nodeMailer = require('nodemailer');
let bcrypt = require('bcrypt');
const { name } = require('ejs');
require('dotenv').config()
var otp = 0


//--------------------email validation function---------------------
function validateEmail(email) {
    const regex = /^[^\s@]+@(gmail\.com|icloud\.com|yahoo\.com)$/;
    return regex.test(email);
}

//----------------------password hasing funcion---------------------
let hashPassword = async (password) => {
    try {
        let passHash = await bcrypt.hash(password, 10)
        return passHash
    } catch (error) {
        console.log(error.message)
    }
}

//-------------insertUser and otp generate function-----------------

let insertUser = async (req, res) => {
    try {
        if (req.body.name == " ") {
            res.render('signup', { nameErrorMsg: "Please Enter Your Name" });
        } else if (!validateEmail(req.body.email)) {
            res.render('signup', { emailErrorMsg: "Please Enter Valid Email" });
        } else {
            let passSec = await hashPassword(req.body.password)
            let newUser = new user({
                name: req.body.name,
                email: req.body.email,
                password: passSec,
                phone: req.body.phone,
                is_block: 0
            })

            let userData = await user.insertMany([newUser])
            if (userData) {
                
                generateOtp()
                res.render('otp')
            } else {
                res.send('kernilla')
            }
        }
    } catch (error) {
        res.status(500).send(error)
    }
}

//--------------signup page----------------
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
    otp = Math.floor(100000 + Math.random() * 999999)
    console.log(otp);
    
}

const sendVerifyMail = async (email, otp) => {
    try {
      await generateOtp()
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

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "OTP Verification",
        text: `<p>Hi ${name},</p><p>Your OTP is: <strong>${otp}</strong><br><br><br>regards,<br><b>TEAM RusticLens<b></p>`,
      }

      const info = await transporter.sendMail(mailoptions);
      console.log('Email has been sent:', info.response);
    } catch (error) {
      console.error('Error sending email:', error.message);
}}



let sentOtp = async (req, res) => {
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
        if (otp == req.body.otp) {
            res.redirect('/signin')
        } else {
            res.render('otp', { msg: "Invalid OTP" })
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
    sendVerifyMail,
    otpLoad,
    otpVerify,
}