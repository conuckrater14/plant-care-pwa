const mongoose = require('mongoose');

const careHistorySchema = new mongoose.Schema({
  type: { type: String, enum: ['watered', 'fertilized', 'repotted', 'pruned'] },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' }
});

const plantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  species: { type: String, default: '' },
  photo: { type: String, default: '' },
  wateringFrequency: { type: Number, default: 3 },
  lastWatered: { type: Date, default: Date.now },
  nextWatering: { type: Date },
  fertilizerFrequency: { type: Number, default: 14 },
  lastFertilized: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  healthScore: { type: Number, default: 100 },
  careHistory: [careHistorySchema]
}, { timestamps: true });

plantSchema.pre('save', function() {
  const now = new Date();
  this.nextWatering = new Date(
    (this.lastWatered || now).getTime() + this.wateringFrequency * 24 * 60 * 60 * 1000
  );
});
module.exports = mongoose.model('Plant', plantSchema);