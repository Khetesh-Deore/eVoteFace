require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sendOTP } = require("../utils/mailer");

const testEmail = "ksdeore370123@kkwagh.edu.in";
const testCode = "847291";

console.log(`Sending OTP ${testCode} to ${testEmail}...`);

sendOTP(testEmail, testCode)
  .then(() => {
    console.log("✅ Email sent successfully! Check your inbox.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Email failed:", err.message);
    process.exit(1);
  });
