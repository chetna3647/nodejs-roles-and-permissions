const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // console.log(req.headers.cookie);
        // const token = req.headers.authorization.split(' ')[1];
        const token = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
        if(!token) {
            res.send("A token is required for authentication");
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        next();
        req.user = decodedToken;
    } catch (err) {
        // res.send("A token is required for authentication!!");
        res.redirect('/login');
    }
};