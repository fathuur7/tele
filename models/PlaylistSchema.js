const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    artist: String,
    duration: String,
    thumbnail: String,
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const playlistSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    songs: [songSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically handle createdAt and updatedAt
});

// Compound index untuk memastikan nama playlist unik per user
playlistSchema.index({ userId: 1, name: 1 }, { unique: true });

const Playlist = mongoose.model('Playlist', playlistSchema);
module.exports = Playlist;