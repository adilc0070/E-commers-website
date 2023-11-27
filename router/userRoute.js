let express=require('express');
let userRoute=express()
let userController=require('../controller/userController');
let bodyParser=require('body-parser');
let path=require('path')
const fileUpload = require('../middleware/multer');
const userAuth = require("../middleware/userAuth");
let cartController = require('../controller/cartController')
let orderController = require('../controller/orderController')

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
userRoute.post('/filterProducts', userController.filterProducts);
userRoute.get('/filteredProducts', userController.displayFilteredProducts);
userRoute.post('/searchProduct',userController.searchitems)

userRoute.get('/profile',userAuth.isAuth,userController.userProfile)
userRoute.get('/editProfile',userAuth.isAuth,userController.editProfile)

userRoute.get('/address',userAuth.isAuth,userController.addressPage)
userRoute.get('/addAddress',userAuth.isAuth,userController.addAddressPage)
userRoute.post('/addNewAddress',userAuth.isAuth,userController.insertAddress)
userRoute.get('/deleteAddress',userAuth.isAuth,userController.deleteAddress)
userRoute.get('/editAddressPage',userAuth.isAuth,userController.editAddressPage)
userRoute.post('/editAddress',userAuth.isAuth,userController.editAddress)

userRoute.get('/cart',userAuth.isAuth,cartController.renderCart)
userRoute.post('/add-to-cart',userAuth.isAuth,cartController.add)
userRoute.post('/update-cart',userAuth.isAuth,cartController.updateQuantity)
userRoute.get('/delete-cart',userAuth.isAuth,cartController.deleteCart)



userRoute.get('/checkout',userAuth.isAuth, orderController.checkoutPage);
userRoute.get('/order',userAuth.isAuth, orderController.orderPage);
userRoute.post('/placeOrder',userAuth.isAuth, orderController.placeOrder);
userRoute.post('/cancelOrder',userAuth.isAuth, orderController.cancelOrder);

userRoute.get('/ordersss',userAuth.isAuth,orderController.orderPage)
userRoute.get('/orderDetails',userAuth.isAuth,orderController.order)
userRoute.get('/downloadInvoice',userAuth.isAuth,orderController.downloadInvoice)
// userRoute.post('/productDetails',userController.productDetails)
module.exports=userRoute