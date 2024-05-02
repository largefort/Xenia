// models/Game.js
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  developerId: mongoose.Schema.Types.ObjectId,
  name: String,
  genre: String,
  iframe: String
});

module.exports = mongoose.model('Game', GameSchema);
