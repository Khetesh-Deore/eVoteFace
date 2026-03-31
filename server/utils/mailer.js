const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (toEmail, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Your eVoteFace OTP — ${otp}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
        <h2 style="color:#1a1a2e">eVoteFace Verification</h2>
        <p>Your one-time password is:</p>
        <h1 style="letter-spacing:8px;color:#e94560;text-align:center">${otp}</h1>
        <p style="color:#666;font-size:13px">This OTP expires in 5 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
};

module.exports = { sendOTP };
