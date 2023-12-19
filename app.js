// connecting mongo db


// modules 
let path=require('path')
let express=require('express')
let app=express()
let userRoute=require('./router/userRoute');
let adminRoute=require('./router/adminRoute');
let session=require('express-session')

let config=require('./config/config')
require("dotenv").config();

let crypto=require('crypto')
let nocache=require('nocache')
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODBURL)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
  });

app.use(session({
  secret:crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}))
app.use(nocache())
// middlewares
app.use(express.static(path.join(__dirname,'public')))
app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')
app.set('views','./views')

app.use('/',userRoute)
app.use('/admin',adminRoute)
app.get('*',(req,res)=>{
    res.status(404).render('404')
})




// starting server
app.listen(3000,()=>console.log('server started on http://localhost:3000'))



