const express = require('express');
const { DailyRecord, CustomEvent, Expense } = require('../models/Tracker');

const router = express.Router();

router.get('/records', async (req, res) => {
  try {
    const records = await DailyRecord.find({ userId: 'default-user' }).sort({ date: 1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch records', error: error.message });
  }
});

router.post('/records', async (req, res) => {
  try {
    const payload = req.body;
    const record = await DailyRecord.findOneAndUpdate(
      { userId: 'default-user', date: payload.date },
      { $set: { ...payload, userId: 'default-user', updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save record', error: error.message });
  }
});

router.get('/custom-events', async (req, res) => {
  try {
    const events = await CustomEvent.find({ userId: 'default-user' }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch custom events', error: error.message });
  }
});

router.post('/custom-events', async (req, res) => {
  try {
    const event = await CustomEvent.create({ ...req.body, userId: 'default-user' });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save custom event', error: error.message });
  }
});

router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: 'default-user' }).sort({ date: 1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, userId: 'default-user' });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save expense', error: error.message });
  }
});

module.exports = router;
