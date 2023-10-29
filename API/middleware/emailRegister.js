const nodemailer = require('nodemailer');

// Create a transporter using your email service provider's SMTP settings
const transporter = nodemailer.createTransport({
    host: 'smtp.googlemail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME, // Use environment variables to store your email credentials
      pass: process.env.EMAIL_PASSWORD // Use environment variables to store your email credentials
    },
    tls:{
    rejectUnauthorized: false
    }
});

function sendVerificationEmail(email, emailToken) {
    const mailOptions = {
        from: 'echovoicechat@gmail.com', // Your email address
        to: email, // Recipient's email address
        subject: 'Email Verification',
        text: `Click the following link to verify your email: https://main.d11izrd17dq8t7.amplifyapp.com/verifyemail?emailToken=${emailToken}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending verification email:', error);
        } else {
            console.log('Verification email sent:', info.response);
        }
    });
}

module.exports = {
    sendVerificationEmail
};
