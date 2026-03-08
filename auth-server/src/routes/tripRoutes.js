const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { authenticateToken } = require('../middleware/authMiddleware');

// All trip routes require authentication
router.use(authenticateToken);

// POST /api/trips — save a new trip
router.post('/', async (req, res) => {
  try {
    const {
      country, city, tripType, duration,
      title, summary, totalDistance, days, imageUrl,
    } = req.body;

    if (!country || !city || !tripType || !duration || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required trip fields',
      });
    }

    const trip = await Trip.create({
      userId: req.user.userId,
      country,
      city,
      tripType,
      duration,
      title,
      summary,
      totalDistance,
      days,
      imageUrl,
    });

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error('Save trip error:', error);
    res.status(500).json({ success: false, message: 'Error saving trip' });
  }
});

// GET /api/trips — list all trips for the authenticated user
router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: trips });
  } catch (error) {
    console.error('List trips error:', error);
    res.status(500).json({ success: false, message: 'Error fetching trips' });
  }
});

// DELETE /api/trips/:id — delete a trip (only if owned by the user)
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or not authorized',
      });
    }

    res.json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ success: false, message: 'Error deleting trip' });
  }
});

module.exports = router;
