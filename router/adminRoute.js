let express=require('express')
let adminRoute=express()
let adminControll=require('../controller/adminController')
let orderController = require('../controller/orderController')

let bodyParser=require('body-parser');
let path=require('path')
let session=require('express-session')

const fileUpload = require('../middleware/multer');



adminRoute.use(bodyParser.json())
adminRoute.use(bodyParser.urlencoded({extended:true}))
adminRoute.use(express.static(path.join(__dirname,'public')))

adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/admin')



adminRoute.get('/login',adminControll.adminLogin)
adminRoute.post('/login',adminControll.adminLogon)

adminRoute.get('/dashboard',adminControll.adminRender)
adminRoute.get('/orderManagement',adminControll.ordersDashboard)
adminRoute.get('/userManagement',adminControll.userManagement)
adminRoute.get('/blockUser', adminControll.blockuser)
adminRoute.get('/unblockUser', adminControll.unblockuser)
adminRoute.get('/logout',adminControll.logOut)
adminRoute.get('/addCatogory',adminControll.addCategory)
adminRoute.get('/addCatRender',adminControll.addCatRender)
adminRoute.post('/addCatogory',adminControll.addCategory)

adminRoute.get('/categoryManagement',adminControll.categoryManagement)
adminRoute.get('/productManagement',adminControll.productManagement)
adminRoute.get('/editCategory',adminControll.editCategory)
adminRoute.post('/editedCategory',adminControll.editedCategory)
adminRoute.get('/blockCategory',adminControll.blockCategory)
adminRoute.get('/unblockCategory',adminControll.unblockCategory)
adminRoute.get('/productAdd',adminControll.productAdd)
adminRoute.post('/addProduct',fileUpload.productImagesUpload,adminControll.addProduct)
adminRoute.get('/updateProductPage',adminControll.updateProductPage)
adminRoute.post('/updateProduct',fileUpload.productImagesUpload,adminControll.updateProduct)
adminRoute.get('/blockProduct',adminControll.blockProduct)
adminRoute.post('/update-order-status/:id', orderController.updateOrderStatus);
adminRoute.get('/downloadSalesReport',adminControll.report)


module.exports=adminRoute