const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const trackerApi = require('../src/api/trackerApi');

dotenv.config();

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use('/api', trackerApi);

const mongoUri = process.env.MONGO_URI;

if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((error) => console.error('MongoDB connection error:', error.message));
} else {
  console.warn('MONGO_URI is not set. Add it to Vercel environment variables.');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tracker API is running' });
});

module.exports = app;
