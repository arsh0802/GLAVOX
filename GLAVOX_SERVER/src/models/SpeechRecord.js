const mongoose = require('mongoose');

const speechRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  textInput: String,
  aiResponse: String
}, { timestamps: true });

module.exports = mongoose.model('SpeechRecord', speechRecordSchema);
