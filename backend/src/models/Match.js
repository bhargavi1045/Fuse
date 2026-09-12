const mongoose = require('mongoose');

const matchPlayerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    username: { type: String, required: true },
    eliminated: { type: Boolean, default: false },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    players: {
      type: [matchPlayerSchema],
      default: [],
    },
    winner: {
      type: String, 
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
