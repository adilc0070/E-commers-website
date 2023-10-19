let express=require('express');
let userRoute=express()
let userController=require('../controller/userController');
let bodyParser=require('body-parser');


userRoute.use(bodyParser.json())
userRoute.use(bodyParser.urlencoded({extended:true}))
userRoute.set('view engine','ejs')
userRoute.set('views','./views')

userRoute.get('/signUp',userController.insertUser)
// userRoute.post('/signIn',)



module.exports=userRoute