import mongoose from 'mongoose';
import User from '../models/User';
import config from '../config';

async function run() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected');

  const adminEmail = 'admin@satify.local';
  const userEmail = 'user@satify.local';

  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    await User.create({ name: 'Admin', email: adminEmail, password: 'Admin123!', role: 'admin' });
    console.log('Created admin:', adminEmail, 'password: Admin123!');
  } else {
    console.log('Admin exists');
  }

  const userExists = await User.findOne({ email: userEmail });
  if (!userExists) {
    await User.create({ name: 'User', email: userEmail, password: 'User123!', role: 'user' });
    console.log('Created user:', userEmail, 'password: User123!');
  } else {
    console.log('User exists');
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((e) => { console.error(e); process.exit(1); });
