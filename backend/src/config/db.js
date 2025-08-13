const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) throw new Error('Missing MongoDB URI');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || undefined,
  });
  console.log('MongoDB connected');
}

module.exports = { connectDB };
