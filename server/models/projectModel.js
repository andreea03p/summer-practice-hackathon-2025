// models/projectModel.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200
    },
    description: { 
      type: String, 
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000
    },
    projectFile: { 
      type: String,
      required: true
    },
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'updated'], 
      default: 'pending' 
    },
    version: { 
      type: Number, 
      default: 1 
    },
    adminFeedback: { 
      type: String, 
      default: '',
      maxlength: 2000
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    previousVersions: [{
      version: Number,
      title: String,
      description: String,
      projectFile: String,
      createdAt: Date,
      status: String,
      adminFeedback: String
    }],
    lastReviewedAt: {
      type: Date,
      default: null
    },
    lastReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    files: [{
      filename: String,
      originalName: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for getting the latest version
projectSchema.virtual('latestVersion').get(function() {
  return this.version;
});

// Method to update average rating
projectSchema.methods.updateAverageRating = async function(newRating) {
  const totalRating = (this.averageRating * this.ratingCount) + newRating;
  this.ratingCount += 1;
  this.averageRating = totalRating / this.ratingCount;
  return this.save();
};

// Method to add a new version
projectSchema.methods.addVersion = async function(newData) {
  // Store current version in previousVersions
  this.previousVersions.push({
    version: this.version,
    title: this.title,
    description: this.description,
    projectFile: this.projectFile,
    createdAt: this.createdAt,
    status: this.status,
    adminFeedback: this.adminFeedback
  });

  // Update current version
  this.version += 1;
  this.title = newData.title || this.title;
  this.description = newData.description || this.description;
  this.projectFile = newData.projectFile;
  this.status = 'updated';
  this.adminFeedback = '';

  return this.save();
};

// Index for better search performance
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ status: 1, createdAt: -1 });

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
