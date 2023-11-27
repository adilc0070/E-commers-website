let express=require('express')
let adminRoute=express()
let adminControll=require('../controller/adminController')
let orderController = require('../controller/orderController')

let bodyParser=require('body-parser');
let path=require('path')
let session=require('express-session')

const fileUpload = require('../middleware/multer');
const adminAuth = require("../middleware/adminAuth");


adminRoute.use(bodyParser.json())
adminRoute.use(bodyParser.urlencoded({extended:true}))
adminRoute.use(express.static(path.join(__dirname,'public')))

adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/admin')


//login and logout
adminRoute.get('/login',adminControll.adminLogin)
adminRoute.post('/login',adminControll.adminLogon)
adminRoute.get('/logout',adminControll.logOut)

//dashboard 
adminRoute.get('/dashboard',adminAuth.isAuth,adminControll.adminRender)

//order management
adminRoute.get('/orderManagement',adminAuth.isAuth,adminControll.ordersDashboard)
adminRoute.post('/update-order-status/:id',adminAuth.isAuth, orderController.updateOrderStatus);
adminRoute.get('/downloadSalesReport',adminAuth.isAuth,adminControll.report)

//user management
adminRoute.get('/userManagement',adminAuth.isAuth,adminControll.userManagement)
adminRoute.get('/blockUser',adminAuth.isAuth, adminControll.blockuser)
adminRoute.get('/unblockUser',adminAuth.isAuth, adminControll.unblockuser)

//category management
adminRoute.get('/addCatRender',adminAuth.isAuth,adminControll.addCatRender)
adminRoute.get('/addCatogory',adminAuth.isAuth,adminControll.addCategory)
adminRoute.post('/addCatogory',adminAuth.isAuth,adminControll.addCategory)
adminRoute.get('/categoryManagement',adminAuth.isAuth,adminControll.categoryManagement)
adminRoute.get('/editCategory',adminAuth.isAuth,adminControll.editCategory)
adminRoute.post('/editedCategory',adminAuth.isAuth,adminControll.editedCategory)
adminRoute.get('/blockCategory',adminAuth.isAuth,adminControll.blockCategory)
adminRoute.get('/unblockCategory',adminAuth.isAuth,adminControll.unblockCategory)

//product management
adminRoute.get('/productManagement',adminAuth.isAuth,adminControll.productManagement)
adminRoute.get('/productAdd',adminAuth.isAuth,adminControll.productAdd)
adminRoute.post('/addProduct',fileUpload.productImagesUpload,adminControll.addProduct)
adminRoute.get('/updateProductPage',adminControll.updateProductPage)
adminRoute.post('/updateProduct',fileUpload.productImagesUpload,adminControll.updateProduct)
adminRoute.get('/blockProduct',adminAuth.isAuth,adminControll.blockProduct)


module.exports=adminRoute