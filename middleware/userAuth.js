const isAuth = async (req,res,next) => {
    try {
        if(!req.session.user_id) {
            res.redirect('/signin');
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