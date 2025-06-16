
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  const msg = {
    to: to,
    from: process.env.SENDER_EMAIL,
    subject: subject,
    text: textContent || htmlContent.replace(/<[^>]*>?/gm, ''), 
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}: "${subject}"`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    if (error.response && error.response.body) {
      console.error('SendGrid Error Details:', error.response.body);
    }
  }
};

module.exports = { sendEmail };