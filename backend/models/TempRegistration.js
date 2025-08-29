const mongoose = require("mongoose");

const tempRegistrationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  encryptedData: { type: String, required: true }, // Encrypted JSON: {username, hashedPassword}
  otpHash: { type: String },
  otpExpiry: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  otpLockedUntil: { type: Date },
  otpLastSentAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("TempRegistration", tempRegistrationSchema);