const nodemailer = require("nodemailer");
const { google }= require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN});

exports.sendMail = async function (recipient, email, cb) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken
            }
        });

        const mailOptions = {
            from: 'StudBudd <pantkartik23@gmail.com>',
            to: recipient,
            subject: email.subject,
            text: email.text,
            html: email.body
        };
        const result = await transporter.sendMail(mailOptions);
        return cb(null, result);
    } catch (err) {
        return cb(err);
    }
}

// Available types of mails
// Register Email
exports.createContent = function (user, type, cb) {
    var htmlBody = {};
    user.generateToken((err, token) => {
        if(err) {
            return cb(err);
        } else {
            switch (type) {
                case 0: // Register email
                    htmlBody.subject = 'Email verification | StudBudd';
                    htmlBody.body = '<html><body><center><h3>Thank you for joining us!</h3></center><p>Hi! '+user.name+`<br>Glad you joined us!<br>Click on the following link to get your email verified!<br><a href="${process.env.BASE_URL}/api/org/verify_email/`+token+'">Confirmation Link</p></body></html>';
                    htmlBody.text = `Glad you joined us!\n\nClick on the following link to get your email verified!\n${process.env.BASE_URL}/api/org/verify_email/`+token;
                    break;
                default:
                    break;
            }
            return cb(null, htmlBody);
        }
    })
}