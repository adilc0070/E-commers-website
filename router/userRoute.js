let express=require('express');
let userRoute=express()
let userController=require('../controller/userController');
let bodyParser=require('body-parser');


userRoute.use(bodyParser.json())
userRoute.use(bodyParser.urlencoded({extended:true}))
userRoute.set('view engine','ejs')
userRoute.set('views','./views/user')

userRoute.get('/',(req,res)=>{
    res.render('404')
})
userRoute.get('/signup',(req,res)=>{
    res.render('signup')
})
userRoute.get('/signIn',(req,res)=>{
    res.render('signIn')
})
// userRoute.post('/signIn',)



module.exports=userRoute