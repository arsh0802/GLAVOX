

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or use "hotmail", "outlook", etc.
  auth: {
    user: process.env.EMAIL_USER,       // your email
    pass: process.env.EMAIL_PASS        // app password (not your main password!)
  }
});

const sendEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: `"GLAVOX Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (err) {
    console.error("Email failed to send:", err);
  }
};

module.exports = sendEmail;