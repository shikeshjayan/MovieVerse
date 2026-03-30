import nodemailer from "nodemailer";

const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendResetEmail = async (toEmail, resetToken) => {
  const resetUrl = `${process.env.FRONT_END_URL}/reset-password?token=${resetToken}`;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"MovieVerse" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your MovieVerse password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Password Reset</h2>
        <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;border-radius:6px;text-decoration:none">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#888">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};
