const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address
      pass: process.env.GMAIL_PASS, // Your Gmail password or app-specific password
    },
});

async function sendMail(subject,receiver,text){
const mailOptions = {
    from: process.env.GMAIL_USER,
    to: receiver,
    subject,
    text
};
try {
await transporter.sendMail(mailOptions);
console.log('Mail to email:', receiver);
return true;
}catch (error) {
    console.error('Error sending Mail', error);
    return false;
}
}

module.exports = sendMail;