const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  jsonTransport: true
});

exports.sendMail = async ({ to, subject, html, attachments }) => {
  try {
    const info = await transporter.sendMail({
      from: '"VendorBridge ERP" <no-reply@vendorbridge.com>',
      to,
      subject,
      html,
      attachments
    });
    console.log(`[Email Mock] Sent mail to ${to} with subject "${subject}"`);
    return info;
  } catch (error) {
    console.error('Failed to send mock email:', error);
    throw error;
  }
};
