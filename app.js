const mongoose=require('mongoose')
mongoose.connect('mongodb://localhost:27017/project')


let express=require('express')
let app=express()
let userRoute=require('./router/userRoute');

app.set('view engine','ejs')
app.set('views','./views')
app.use('/',userRoute)

app.listen(9100,()=>console.log('server started on http://localhost:9100'))




