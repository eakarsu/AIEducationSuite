const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const createTransporter = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  // Dev mode - log to console
  return null;
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    logger.info(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
    logger.info(`[DEV EMAIL] Body: ${html}`);
    return { success: true, dev: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@aieducation.com',
      to,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    logger.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Password Reset - AI Education Suite',
    html: `<h2>Password Reset</h2><p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`
  });
};

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify Your Email - AI Education Suite',
    html: `<h2>Email Verification</h2><p>Click the link below to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendVerificationEmail };
