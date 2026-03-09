const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    // DEBUG LOG: This will show you the structure without the password
    if (uri) {
      const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
      console.log(`Attempting to connect with URI: ${maskedUri}`);
    } else {
      console.error("MONGODB_URI is completely undefined in process.env");
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    // Check if it's specifically an auth error
    if (error.message.includes('auth failed')) {
      console.error("TIP: Check your DB_USER and DB_PASSWORD in the Atlas connection string.");
    }
    process.exit(1);
  }
};

module.exports = connectDB;