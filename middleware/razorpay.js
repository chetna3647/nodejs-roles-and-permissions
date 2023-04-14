const Razorpay = require('razorpay');

const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
})

module.exports = rzp;