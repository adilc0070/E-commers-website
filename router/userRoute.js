let express=require('express');
let userRoute=express()
let userController=require('../controller/userController');
let bodyParser=require('body-parser');
let path=require('path')
const fileUpload = require('../middleware/multer');
let is_auth=require('../middleware/isAuth')
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

userRoute.get('/profile',userController.userProfile)
userRoute.get('/editProfile',userController.editProfile)

userRoute.get('/address',userController.addressPage)
userRoute.get('/addAddress',userController.addAddressPage)
userRoute.post('/addNewAddress',userController.insertAddress)
userRoute.get('/deleteAddress',userController.deleteAddress)
userRoute.get('/editAddressPage',userController.editAddressPage)
userRoute.post('/editAddress',userController.editAddress)

userRoute.get('/cart',cartController.renderCart)
userRoute.post('/add-to-cart',cartController.add)
userRoute.post('/update-cart',cartController.updateQuantity)
userRoute.get('/delete-cart',cartController.deleteCart)



userRoute.get('/checkout', orderController.checkoutPage);
userRoute.get('/order', orderController.orderPage);
userRoute.post('/placeOrder', orderController.placeOrder);
userRoute.post('/cancelOrder', orderController.cancelOrder);

userRoute.get('/ordersss',orderController.orderPage)
userRoute.get('/orderDetails',orderController.order)
userRoute.get('/downloadInvoice',orderController.downloadInvoice)
// userRoute.post('/productDetails',userController.productDetails)
module.exports=userRoute