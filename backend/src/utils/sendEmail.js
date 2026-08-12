const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Build (and cache) a Gmail SMTP transporter from env credentials.
 * Requires EMAIL_USER + EMAIL_APP_PASSWORD (a Google App Password).
 */
const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error(
      'Email is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD in backend/.env'
    );
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  return cachedTransporter;
};

/**
 * Send a branded OTP email for account verification.
 */
const sendOtpEmail = async ({ to, name, otp }) => {
  const transporter = getTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || 'Bright';

  const html = `
  <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px;">
    <h1 style="margin: 0 0 4px; font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #0057FF, #00D9FF); -webkit-background-clip: text; background-clip: text; color: #0057FF;">Bright</h1>
    <p style="margin: 0 0 24px; color: #475569; font-size: 13px;">Bright Choices. Smarter Phones.</p>
    <p style="color: #0B1220; font-size: 15px;">Hi ${name || 'there'},</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Use the verification code below to activate your Bright account. This code expires in 15 minutes.
    </p>
    <div style="margin: 24px 0; text-align: center;">
      <span style="display: inline-block; font-size: 34px; letter-spacing: 10px; font-weight: 700; color: #0057FF; background: #F1F5FF; padding: 16px 28px; border-radius: 12px; border: 1px dashed #0057FF;">
        ${otp}
      </span>
    </div>
    <p style="color: #94A3B8; font-size: 12px; line-height: 1.6;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>`;

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your Bright verification code: ${otp}`,
    text: `Your Bright verification code is ${otp}. It expires in 15 minutes.`,
    html,
  });
};

/**
 * Send a branded password reset OTP email.
 */
const sendPasswordResetEmail = async ({ to, name, otp }) => {
  const transporter = getTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || 'Bright';

  const html = `
  <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px;">
    <h1 style="margin: 0 0 4px; font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #0057FF, #00D9FF); -webkit-background-clip: text; background-clip: text; color: #0057FF;">Bright</h1>
    <p style="margin: 0 0 24px; color: #475569; font-size: 13px;">Bright Choices. Smarter Phones.</p>
    <p style="color: #0B1220; font-size: 15px;">Hi ${name || 'there'},</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      We received a request to reset your password. Use the 6-digit verification code below to proceed. This code expires in 15 minutes.
    </p>
    <div style="margin: 24px 0; text-align: center;">
      <span style="display: inline-block; font-size: 34px; letter-spacing: 10px; font-weight: 700; color: #0057FF; background: #F1F5FF; padding: 16px 28px; border-radius: 12px; border: 1px dashed #0057FF;">
        ${otp}
      </span>
    </div>
    <p style="color: #94A3B8; font-size: 12px; line-height: 1.6;">
      If you did not request a password reset, please secure your account or ignore this email.
    </p>
  </div>`;

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Reset your Bright password: ${otp}`,
    text: `Your Bright password reset code is ${otp}. It expires in 15 minutes.`,
    html,
  });
};

module.exports = { sendOtpEmail, sendPasswordResetEmail, getTransporter };
