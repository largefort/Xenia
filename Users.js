// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,  // For simplicity, avoid storing plain text passwords in production
  role: String       // 'player' or 'developer'
});

module.exports = mongoose.model('User', UserSchema);
