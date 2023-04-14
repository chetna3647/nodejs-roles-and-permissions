const mailer = require('nodemailer');

exports.smtpProtocol = mailer.createTransport({
    service: "Gmail",
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
});

exports.mailoption = {
    from: process.env.MAIL_FROM_ADDRESS,
    text: "Verification Mail"
}