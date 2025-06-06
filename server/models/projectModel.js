const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'updated'],
        default: 'pending'
    },
    fileUrl: {
        type: String,
        required: true
    },
    version: {
        type: Number,
        default: 1
    },
    previousVersion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    adminFeedback: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Project', projectSchema); 