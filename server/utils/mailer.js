const nodemailer = require("nodemailer");

// Lazy transporter — created on first use so env vars are loaded
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

const sendOTP = async (toEmail, otp, fullName = '') => {
  const transport = getTransporter();

  // Verify connection before sending
  await transport.verify();

  await transport.sendMail({
    from: process.env.EMAIL_FROM || `eVoteFace <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your eVoteFace Voting OTP: ${otp}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:12px;background:#fff">
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="color:#1a1a2e;margin:0">🗳️ eVoteFace</h2>
          <p style="color:#666;margin:4px 0 0">Secure Digital Voting</p>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px"/>
        <p style="color:#333;margin:0 0 8px">Hello${fullName ? ' ' + fullName : ''},</p>
        <p style="color:#333;margin:0 0 24px">Your one-time password (OTP) for voting verification is:</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px">
          <h1 style="letter-spacing:12px;color:#e94560;margin:0;font-size:36px">${otp}</h1>
        </div>
        <p style="color:#666;font-size:13px;margin:0 0 8px">⏱️ This OTP expires in <strong>5 minutes</strong>.</p>
        <p style="color:#666;font-size:13px;margin:0 0 24px">🔒 Do not share this OTP with anyone.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:0 0 16px"/>
        <p style="color:#999;font-size:11px;margin:0;text-align:center">
          eVoteFace — Decentralized Voting with Face Recognition &amp; Blockchain
        </p>
      </div>
    `,
    text: `Your eVoteFace OTP is: ${otp}\n\nThis OTP expires in 5 minutes. Do not share it with anyone.`
  });
};

module.exports = { sendOTP };
