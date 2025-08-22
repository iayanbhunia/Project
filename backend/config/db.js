const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Fix for the voterId index issue
    try {
      // Get the User model
      const User = mongoose.model('User');
      
      // Check if the collection exists
      const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
      
      if (collections.length > 0) {
        console.log('Attempting to fix voterId index...');
        
        // Drop the problematic index if it exists
        try {
          await User.collection.dropIndex('voterId_1');
          console.log('Dropped existing voterId index');
        } catch (indexError) {
          // Index might not exist, which is fine
          console.log('No existing voterId index to drop or error dropping index');
        }
        
        // Create a new sparse index
        await User.collection.createIndex({ voterId: 1 }, { unique: true, sparse: true });
        console.log('Created new sparse index for voterId');
      }
    } catch (indexFixError) {
      console.error('Error fixing voterId index:', indexFixError);
      // Continue anyway, as this is just a fix attempt
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 