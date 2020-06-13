var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: `${process.env.EMAIL}`,
    pass: `${process.env.EMAIL_PASS}`
  }
});

exports.sendVerificationEmail = (email, token, type) => {
  var mailOptions = null;
  if (type == 'register') {
    mailOptions = {
      from: `Showly No-reply <${process.env.EMAIL}>`,
      to: email,
      subject: 'Verify your email address!',
      html: '<p> You are signed up! Please follow the link below to complete your registration: </p>' +
            '<p><a href="https://showly-app-gt4zi5dm3k.herokuapp.com/confirm?token=' + token + '"> Verify </a></p>' +
            '<p> Token expires in 1 day. If it expires, you can reset it via the login page. </p>',
    };
  }
  else if (type == 'reset') {
    mailOptions = {
      from: `Showly No-reply <${process.env.EMAIL}>`,
      to: email,
      subject: 'Reset password!',
      html: '<p> To reset your password, follow the link below: </p>' +
            '<p><a href="https://showly-app-gt4zi5dm3k.herokuapp.com/reset?token=' + token + '"> Reset </a></p>' +
            '<p> Token expires in 1 day. </p>',
    };
  }

  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
    }
  });
}