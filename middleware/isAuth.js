function isLogin(req,res,next){
    if(!req.session.user_id){
        res.redirect("/signin")
    }else{

        next()
    }
}
function logOut(req,res,next){
    if(req.session.user_id){
        res.redirect("/signin")
    }else{
        next()
    }
}
module.exports={
    isLogin,
    logOut
}