let user=require('../models/userModel');


let insertUser=async(req,res)=>{
    try {
        let newUser=new user({
            name:req.body.name,
            email:req.body.email,
            password:req.body.password,
            phone:req.body.phone,
            isBlock:0
        })
        let userData=newUser.save()  
        
    } catch (error) {
        res.status(500).send(error)
    }
}


let signUpPage=async(req,res)=>{
    try {
        res.render('signup')
    } catch (error) {
        res.status(500).send(error)
    }
}

let loginUser=async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        res.status(500).send(error) 
    }
}



module.exports={
    insertUser,
    loginUser,
    signUpPage
}