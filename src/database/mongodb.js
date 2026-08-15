const mongoose = require('mongoose');
const { mongoUri } = require('../config');

async function connectDatabase() {
  if (!mongoUri) throw new Error('MONGODB_URI is missing. Add it to .env.');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected.');
}

module.exports = { mongoose, connectDatabase };
