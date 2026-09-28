const nodemailer = require('nodemailer');
const env = require('../../config/env');

let transporter;

const getTransporter = () => {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
};

const isEnabled = () => env.smtpEnabled;

/**
 * Sends a plain-text email. `replyTo` is the app user's own address so replies reach them
 * even when the SMTP account is a shared/sending-only mailbox.
 */
const sendMail = ({ to, subject, text, replyTo, fromName }) =>
  getTransporter().sendMail({
    from: fromName ? `"${fromName.replace(/"/g, '')}" <${env.EMAIL_FROM || env.SMTP_USER}>` : env.EMAIL_FROM || env.SMTP_USER,
    to,
    subject,
    text,
    replyTo,
  });

module.exports = { isEnabled, sendMail };
