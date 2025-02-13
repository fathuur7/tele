const Playlist = require('../models/PlaylistSchema');

class PlaylistStorageDB {
    async createPlaylist(userId, name) {
        try {
            const playlist = new Playlist({
                userId,
                name
            });
            await playlist.save();
            return playlist;
        } catch (error) {
            if (error.code === 11000) { // MongoDB duplicate key error
                throw new Error('Playlist dengan nama tersebut sudah ada');
            }
            throw error;
        }
    }

    async getPlaylist(userId, name) {
        return await Playlist.findOne({ userId, name });
    }

    async getAllUserPlaylists(userId) {
        return await Playlist.find({ userId })
            .sort({ updatedAt: -1 }); // Sort by latest updated
    }

    async addSongToPlaylist(userId, playlistName, songData) {
        const playlist = await Playlist.findOne({ userId, name: playlistName });
        if (!playlist) {
            throw new Error('Playlist tidak ditemukan');
        }

        playlist.songs.push(songData);
        playlist.updatedAt = new Date();
        await playlist.save();
        return playlist;
    }

    async removeSongFromPlaylist(userId, playlistName, songIndex) {
        const playlist = await Playlist.findOne({ userId, name: playlistName });
        if (!playlist) {
            throw new Error('Playlist tidak ditemukan');
        }

        if (songIndex >= 0 && songIndex < playlist.songs.length) {
            playlist.songs.splice(songIndex, 1);
            playlist.updatedAt = new Date();
            await playlist.save();
            return true;
        }
        return false;
    }

    async deletePlaylist(userId, name) {
        const result = await Playlist.deleteOne({ userId, name });
        return result.deletedCount > 0;
    }

    async updatePlaylistName(userId, oldName, newName) {
        const playlist = await Playlist.findOne({ userId, name: oldName });
        if (!playlist) {
            throw new Error('Playlist tidak ditemukan');
        }

        playlist.name = newName;
        playlist.updatedAt = new Date();
        await playlist.save();
        return playlist;
    }

    // Method untuk mencari playlist berdasarkan kata kunci
    async searchPlaylists(userId, keyword) {
        return await Playlist.find({
            userId,
            name: { $regex: keyword, $options: 'i' }
        }).sort({ updatedAt: -1 });
    }
}

module.exports = PlaylistStorageDB;