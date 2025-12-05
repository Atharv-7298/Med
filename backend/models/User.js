const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
