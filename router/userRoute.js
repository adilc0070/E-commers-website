let express=require('express');
let userRoute=express()
let userController=require('../controller/userController');
let bodyParser=require('body-parser');
let path=require('path')


userRoute.use(bodyParser.json())
userRoute.use(bodyParser.urlencoded({extended:true}))
userRoute.set('view engine','ejs')
userRoute.set('views','./views/user')
userRoute.use(express.static(path.join(__dirname,'public')))

userRoute.get('/signup',userController.signUpPage)
userRoute.post('/signup',userController.insertUser)


userRoute.get('/signin',(req,res)=>{})
// userRoute.post('/signIn',)



module.exports=userRoute