const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  console.log('Connecting to:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 30) + '...' : 'undefined');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB:', mongoose.connection.name);
  const db = mongoose.connection.db;

  const res1 = await db.collection('users').updateMany(
    { role: { $regex: /^admin$/i } },
    { $set: { role: 'ADMIN' } }
  );
  console.log('Admin roles updated to uppercase ADMIN:', res1.modifiedCount);

  const res2 = await db.collection('users').updateMany(
    { role: { $regex: /^user$/i } },
    { $set: { role: 'USER' } }
  );
  console.log('User roles updated to uppercase USER:', res2.modifiedCount);

  const res3 = await db.collection('users').updateMany(
    { isEmailVerified: { $ne: true } },
    { $set: { isEmailVerified: true } }
  );
  console.log('Email verified flags updated to true:', res3.modifiedCount);

  const res4 = await db.collection('users').updateMany(
    { status: { $exists: false } },
    { $set: { status: 'ACTIVE' } }
  );
  console.log('Status flags updated to ACTIVE:', res4.modifiedCount);

  const updated = await db.collection('users').find({}).toArray();
  console.log('--- ALL UPDATED USERS ---');
  updated.forEach(u => console.log({
    email: u.email,
    role: u.role,
    isEmailVerified: u.isEmailVerified,
    status: u.status
  }));

  await mongoose.disconnect();
  console.log('Migration complete!');
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
