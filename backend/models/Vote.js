const mongoose = require('mongoose');

const voteSchema = mongoose.Schema(
  {
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true,
    },
    constituency: {
      type: String,
      required: true,
    },
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a voter can only vote once per election
voteSchema.index({ election: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema); 