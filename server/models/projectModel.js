// models/projectModel.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, required: true },
    projectFile: { 
      type: String,
      required: true
    },
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:      { type: String, enum: ['pending', 'reviewed', 'updated'], default: 'pending' },
    version:     { type: Number, default: 1 },
    adminFeedback: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
