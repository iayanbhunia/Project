const mongoose = require('mongoose');

const electionSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    startDate: {
      type: Date,
      required: [true, 'Please add a start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please add an end date'],
    },
    constituencies: [{
      name: {
        type: String,
        required: true,
      },
      candidates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      voters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
    }],
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
    },
    manuallyCompleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Election', electionSchema); 