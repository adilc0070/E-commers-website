const isAuth = async (req,res,next) => {
    try {
        if(!req.session.admin_id){
            res.redirect('/admin/login');
        } else {
            next()
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    isAuth
}