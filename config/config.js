const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
}

const config = {
    bot: {
        token: process.env.BOT_TOKEN || ''
    },
    download: {
        path: './downloads',
        maxSize: 50 * 1024 * 1024, // 50MB (Telegram limit)
        cleanupInterval: 3600000, // 1 hour in ms
        maxRetries: 3,
        timeout: 300000 // 5 minutes
    }
};

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});

module.exports = config;
