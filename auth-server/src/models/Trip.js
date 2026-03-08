const mongoose = require('mongoose');

const coordinatesSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { _id: false });

const dayPlanSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  distance: { type: Number, default: 0 },
  startPoint: { type: coordinatesSchema, required: true },
  endPoint: { type: coordinatesSchema, required: true },
  waypoints: { type: [coordinatesSchema], default: [] },
  highlights: { type: [String], default: [] },
}, { _id: false });

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  country: { type: String, required: true },
  city: { type: String, required: true },
  tripType: { type: String, enum: ['trek', 'bike'], required: true },
  duration: { type: Number, required: true },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  totalDistance: { type: Number, default: 0 },
  days: { type: [dayPlanSchema], default: [] },
  imageUrl: { type: String, default: '' },
}, {
  timestamps: true, // adds createdAt & updatedAt automatically
});

module.exports = mongoose.model('Trip', tripSchema);
