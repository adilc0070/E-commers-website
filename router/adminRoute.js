let express=require('express')
let adminRoute=express()
let adminControll=require('../controller/adminController')

let bodyParser=require('body-parser');
let path=require('path')


adminRoute.use(bodyParser.json())
adminRoute.use(bodyParser.urlencoded({extended:true}))
adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/user')
adminRoute.use(express.static(path.join(__dirname,'public')))



adminRoute.get('/login',adminControll.adminLogin)
adminRoute.post('/')


module.exports=adminRoute