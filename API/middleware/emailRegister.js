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
        from: 'echovoicechat@gmail.com',
        to: email,
        subject: 'Echo Email Verification',
        html: `
            <html>
                <body style="text-align: center;">
                    <img src="cid:echo-logo" alt="Echo Logo" width="100" />
                    <br>
                    <h1 style="font-size:24px;">Echo Email Verification</h1>
                    <p>Please click the link below to verify your email:</p>
                    <a href="https://main.d11izrd17dq8t7.amplifyapp.com/verifyemail?emailToken=${emailToken}" target="_blank">
                        <button style="font-size: 16px; background-color: #456B9A; color: #FFF; padding: 10px 20px; border: none; cursor: pointer;">Verify Email</button>
                    </a>
                    <br>
                </body>
            </html>
        `,
        attachments: [
            {
                filename: 'Echo_Logo.png',
                path: '../assets/Echo_Logo.png', 
                cid: 'echo-logo' 
            }
        ]
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
