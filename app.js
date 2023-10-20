const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/project')
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
  });



let path=require('path')

let express=require('express')
let app=express()
let userRoute=require('./router/userRoute');
app.use(express.static(path.join(__dirname,'public')))
app.set('view engine','ejs')
app.set('views','./views')
app.use('/',userRoute)
app.get('*',(req,res)=>{
    res.status(404).render('404')
})


app.listen(9100,()=>console.log('server started on http://localhost:9100'))



