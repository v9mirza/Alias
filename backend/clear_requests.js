import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChatRequest from './src/models/ChatRequest.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await ChatRequest.deleteMany({});
  console.log(`Deleted ${result.deletedCount} chat requests.`);
  await mongoose.connection.close();
}

run();
