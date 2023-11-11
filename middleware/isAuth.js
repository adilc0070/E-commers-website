function isLogin(req, res, next) {
    if (!req.session.user_id) {
        res.redirect("/signin");
    } else {
        next(); // Call next before redirecting
        res.redirect("/home");
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