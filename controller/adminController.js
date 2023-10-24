let adminModel=require('../model/adminModel')
let user=require('../model/userModel')
let bcrypt=require('bcrypt')
let env=require('dotenv')
env.config()

//--------------------email validation function---------------------
function validateEmail(email) {
    const regex = /^[^\s@]+@(gmail\.com|icloud\.com|yahoo\.com)$/;
    return regex.test(email);
}


let adminLogin=async(req,res)=>{
    try {
        res.render('adminLogIn')
    } catch (error) {
        console.log(error.message);
    }
}


let adminLogon=async(req,res)=>{
    let {adminEmail,adminPassword}=req.body

    try {
        if(!adminEmail || !adminPassword){
            return res.render('adminLogIn',{msg:'Please Enter Email and Password'})
        }
        if(!validateEmail(adminEmail)){
            return res.render('adminLogIn',{msg:'Please Enter Valid Email'})
        }

        let adminData=await adminEmail==process.env.email
        if(!adminData){
            return res.render('adminLogIn',{msg:'Sorry Admin not Found'})
        }

        let isMatch=await adminPassword==process.env.password
        if(isMatch){
            req.session.admin_id=adminData._id;
            return res.redirect('/admin/dashboard')
        }else{

            return res.render('adminLogIn',{msg:'Wrong Password'})
        }

    } catch (error) {
        res.render('adminLogIn',{msg:'Something went wrong'})
    }
}


module.exports={
    adminLogin,
    adminLogon,
    
}