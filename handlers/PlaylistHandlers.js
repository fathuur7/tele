class PlaylistHandlers {
    constructor(storage) {
        this.storage = storage;
    }

    async handleCreatePlaylist(ctx) {
        try {
            const match = ctx.message.text.match(/\/createplaylist\s+(.+)/);
            if (!match) {
                return ctx.reply('❌ Format: /createplaylist [nama_playlist]');
            }

            const playlistName = match[1].trim();
            const userId = ctx.from.id.toString(); // Convert to string for MongoDB

            // Validasi nama playlist
            if (playlistName.length < 3 || playlistName.length > 50) {
                return ctx.reply('❌ Nama playlist harus antara 3-50 karakter');
            }

            const playlist = await this.storage.createPlaylist(userId, playlistName);
            return ctx.reply(
                `✅ Playlist "${playlistName}" berhasil dibuat!\n\n` +
                `ID: ${playlist._id}\n` +
                `Dibuat: ${playlist.createdAt.toLocaleString()}\n\n` +
                `Gunakan:\n` +
                `/addtoplaylist ${playlistName} [URL] untuk menambah lagu`
            );

        } catch (error) {
            console.error('Create playlist error:', error);
            return ctx.reply(`❌ Error: ${error.message}`);
        }
    }

    async handleShowPlaylists(ctx) {
        try {
            
            const userId = ctx.from.id.toString();
            const playlists = await this.storage.getAllUserPlaylists(userId);

            if (playlists.length === 0) {
                return ctx.reply(
                    '📂 Anda belum memiliki playlist.\n\n' +
                    'Buat playlist baru dengan:\n' +
                    '/createplaylist [nama]'
                );
            }

            const message = playlists.map((playlist, index) => {
                return `${index + 1}. 📂 ${playlist.name}\n` +
                       `   └ ${playlist.songs.length} lagu | ` +
                       `Update: ${playlist.updatedAt.toLocaleString()}`;
            }).join('\n\n');

            return ctx.reply(
                `📂 *Daftar Playlist Anda*\n\n${message}\n\n` +
                `Total: ${playlists.length} playlist\n\n` +
                `Gunakan:\n` +
                `/playlist [nama] untuk melihat detail playlist`,
                { parse_mode: 'Markdown' }
            );

        } catch (error) {
            console.error('Show playlists error:', error);
            return ctx.reply('❌ Terjadi kesalahan saat menampilkan playlist');
        }
    }

    async handleAddToPlaylist(ctx) {
        try {
            const match = ctx.message.text.match(/\/addtoplaylist\s+([^\s]+)\s+(https?:\/\/.+)/);
            if (!match) {
                return ctx.reply('❌ Format: /addtoplaylist [nama_playlist] [URL]');
            }

            const [_, playlistName, songUrl] = match;
            const userId = ctx.from.id.toString();

            // Di sini bisa ditambahkan fungsi untuk mendapatkan metadata lagu dari URL
            const songData = {
                title: 'Judul  Lagu', // Seharusnya dari metadata
                url: songUrl,
                artist: 'Nama Artis',
                duration: '3:45',
                addedAt: new Date()
            };

            const updatedPlaylist = await this.storage.addSongToPlaylist(
                userId,
                playlistName,
                songData
            );

            console.log('Updated Playlist:', updatedPlaylist);
            return ctx.reply(
                `✅ Lagu berhasil ditambahkan!\n\n` +
                `Playlist: ${playlistName}\n` +
                `Total lagu: ${updatedPlaylist.songs.length}`
            );

        } catch (error) {
            console.error('Add to playlist error:', error);
            return ctx.reply(`❌ Error: ${error.message}`);
        }
    }
}

module.exports = PlaylistHandlers;