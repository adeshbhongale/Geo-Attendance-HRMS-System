const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const resetDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database...');

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      // Skip system collections if any
      if (collectionName.startsWith('system.')) continue;
      
      await mongoose.connection.db.collection(collectionName).deleteMany({});
      console.log(`Cleared data from collection: ${collectionName}`);
    }

    console.log('Database reset successfully (all collections cleared)');
    process.exit();
  } catch (err) {
    console.error('Error resetting database:', err.message);
    process.exit(1);
  }
};

resetDB();
