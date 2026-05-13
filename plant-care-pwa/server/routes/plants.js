const express = require('express');
const Plant = require('../models/Plant');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const plants = await Plant.find({ owner: req.user.id }).sort({ nextWatering: 1 });
    res.json(plants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user.id });
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    res.json(plant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const plant = await Plant.create({ ...req.body, owner: req.user.id });
    res.status(201).json(plant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /:id — allowlist only safe editable fields
router.put('/:id', auth, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user.id });
    if (!plant) return res.status(404).json({ message: 'Plant not found' });

    const allowed = [
      'name',
      'species',
      'wateringFrequency',
      'fertilizerFrequency',
      'notes',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        plant[field] = req.body[field];
      }
    });

    await plant.save();
    res.json(plant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const plant = await Plant.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    res.json({ message: 'Plant deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/water', auth, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user.id });
    if (!plant) return res.status(404).json({ message: 'Plant not found' });

    plant.lastWatered = new Date();
    plant.careHistory.push({ type: 'watered', note: req.body.note || '' });
    plant.healthScore = Math.min(100, plant.healthScore + 10);

    await plant.save();
    res.json(plant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/fertilize', auth, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user.id });
    if (!plant) return res.status(404).json({ message: 'Plant not found' });

    plant.lastFertilized = new Date();
    plant.careHistory.push({ type: 'fertilized', note: req.body.note || '' });
    plant.healthScore = Math.min(100, plant.healthScore + 5);

    await plant.save();
    res.json(plant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/prune', auth, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user.id });
    if (!plant) return res.status(404).json({ message: 'Plant not found' });

    plant.careHistory.push({ type: 'pruned', note: req.body.note || '' });
    plant.healthScore = Math.min(100, plant.healthScore + 3);

    await plant.save();
    res.json(plant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/repot', auth, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user.id });
    if (!plant) return res.status(404).json({ message: 'Plant not found' });

    plant.careHistory.push({ type: 'repotted', note: req.body.note || '' });
    plant.healthScore = Math.min(100, plant.healthScore + 7);

    await plant.save();
    res.json(plant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;