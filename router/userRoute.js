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

userRoute.get('/',userController.homePage)

userRoute.get('/signup',userController.signUpPage)
userRoute.post('/signup',userController.insertUser)

userRoute.get('/otp',userController.otpLoad)
userRoute.post('/otp',userController.otpVerify)
userRoute.get('/resendOtp',userController.resendOtp)

userRoute.get('/forgotPassword',userController.forgotPassword)
userRoute.post('/resetPassword',userController.resetPassword)
userRoute.get('/signin',userController.loginPage)
userRoute.post('/signin',userController.loginUser)
// userRoute.post('/signIn',)


userRoute.get('/home',userController.homePage)
userRoute.get('/signout',userController.logOut)

userRoute.get('/productDetail',userController.productDetail)
userRoute.get('/products',userController.productPage)

userRoute.get('/userProfile',userController.userProfile)
// userRoute.post('/productDetails',userController.productDetails)
module.exports=userRoute