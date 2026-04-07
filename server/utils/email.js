const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // use Gmail App Password, not account password
  },
});

/**
 * Send an email.
 * @param {string} to      - recipient email
 * @param {string} subject - email subject
 * @param {string} html    - HTML body
 */
const sendEmail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: `"CivicConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  return info;
};

module.exports = { sendEmail };
