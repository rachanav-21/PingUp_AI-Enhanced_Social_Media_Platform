import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './configs/db.js';

await connectDB();

const email = 'ruchiruchitha645@gmail.com';
const profileUrl = 'https://randomuser.me/api/portraits/women/44.jpg';

const usersCollection = mongoose.connection.db.collection('users');
const result = await usersCollection.updateOne(
  { email },
  {
    $set: {
      name: 'rachana.here',
      full_name: 'rachana.here',
      username: 'rachana.here',
      profile_picture: profileUrl,
      profilePicture: profileUrl
    }
  }
);

const updatedUser = await usersCollection.findOne(
  { email },
  { projection: { _id: 1, name: 1, full_name: 1, username: 1, profile_picture: 1, profilePicture: 1, email: 1 } }
);

console.log(JSON.stringify({ ok: true, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, user: updatedUser }, null, 2));

await mongoose.disconnect();
