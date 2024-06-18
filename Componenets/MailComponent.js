const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: 'mail.delta-innovation.net', // Your SMTP server hostname
  port: 465, // Port for secure SMTP
  secure: true, // true for SSL, false for other ports like 587 or 25
  auth: {
      user: 'test@delta-innovation.net', // Your email address
      pass: 'QQamo}Tig&$w' // Your email password
  }
});

exports.main = async (email, code) => {
  
  try {
      const info = await transporter.sendMail({
          from: '"Fred Foo 👻" <clinic@test.com>', // sender address
          to: email, // list of receivers
          subject: "Account Activation", // Subject line
          html: `<p>Your confirmation code is:</p><h1>${code}</h1>`, // html body
      });

      console.log("Message sent: %s", info.messageId);
      console.log("success : ", info.accepted);
      console.log("failed : ", info.rejected);
  } catch (error) {
      console.error("Failed to send email:", error);
  }
};


  
  exports.resetPassword = async (email,code) => {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '<assistini@test.com>', // sender address
      to: `${email}`, // list of receivers
      subject: "Reset Password Code ", // Subject line
      text: "Hello, Copy this code please ", // plain text body
      html: `<h1>${code}</h1>`, // html body
    });
  
    console.log("Message sent: %s", info.messageId);
   
  }
