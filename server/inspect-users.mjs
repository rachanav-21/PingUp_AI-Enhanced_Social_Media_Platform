import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './configs/db.js';
import User from './models/User.js';

await connectDB();
const docs = await User.find({}).lean();
console.log(JSON.stringify(docs, null, 2));
await mongoose.disconnect();
