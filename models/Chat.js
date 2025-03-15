const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  userMessage: { type: String, required: true },
  botMessage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

ChatSchema.index({ timestamp: 1 });

module.exports = mongoose.model("Chat", ChatSchema);
