const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['voter', 'leader', 'admin'],
      default: 'voter',
    },
    voterId: {
      type: String,
      sparse: true,
      unique: true,
    },
    hasVoted: {
      type: Boolean,
      default: false,
    },
    constituency: {
      type: String,
      required: function() {
        return this.role === 'leader' || this.role === 'voter';
      },
    },
    party: {
      type: String,
      required: function() {
        return this.role === 'leader';
      },
    },
    manifesto: {
      type: String,
      required: function() {
        return this.role === 'leader';
      },
    },
    votes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema); 