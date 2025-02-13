class MessageFormatter {
    static escapeMarkdown(text) {
        return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    }

    static formatWelcomeMessage(firstName) {
        return `
🎵 *Selamat Datang di Music Bot* 🎵

Halo, ${this.escapeMarkdown(firstName)}! 
Saya adalah asisten musik Anda yang dapat membantu mencari dan mengunduh lagu favorit Anda.

*Perintah Utama:*
📱 \`/lagu [Judul Lagu]\` \\- Mencari lagu
⬇️ \`/download [URL YouTube]\` \\- Mengunduh lagu
🎵 \`/playlist\` \\- Mengelola playlist Anda
ℹ️ \`/help\` \\- Panduan lengkap
📊 \`/status\` \\- Cek status bot
🤖 \`/ai [Pertanyaan]\` \\- Informasi mendalam tentang musik

*Fitur Baru:*
🎼 Playlist Management
📊 Statistik Unduhan
🎯 Pencarian Lanjutan
🎵 Informasi Lagu Detail

*Tips:*
• Sertakan nama artis untuk hasil lebih akurat
• Gunakan format: Judul Lagu \\- Nama Artis
• Cek /help untuk panduan lengkap

*Version 2\\.0*
Bot dikembangkan oleh @Yourboy8w`;
    }

    static formatHelpMessage() {
        return `
🎵 *Panduan Lengkap Music Bot* 🎵

*1\\. Perintah Dasar:*
• \`/lagu [Judul]\` \\- Mencari lagu
• \`/download [URL]\` \\- Mengunduh lagu
• \`/status\` \\- Cek status bot
• \`/ai [Pertanyaan]\` \\- Informasi musik

*2\\. Manajemen Playlist:*
• \`/createplaylist [Nama]\` \\- Buat playlist baru
• \`/addtoplaylist [Nama] [URL]\` \\- Tambah lagu
• \`/showplaylist\` \\- Lihat playlist
• \`/deleteplaylist [Nama]\` \\- Hapus playlist

*3\\. Format Pencarian:*
• \`/lagu Judul \\- Artis\`
• \`/lagu Nama Album \\- Artis\`
• \`/searchbygenre [Genre]\` \\- Cari per genre
• \`/trending\` \\- Lagu trending

*4\\. Pengaturan Unduhan:*
• \`/quality [URL] [quality]\` \\- Pilih kualitas
• \`/format [URL] [format]\` \\- Pilih format

*5\\. Batasan Sistem:*
• Ukuran Max: 50MB
• Format: MP3
• Timeout: 5 menit
• Max Playlist: 50 lagu

*6\\. Fitur Tambahan:*
• \`/lyrics [Judul]\` \\- Cari lirik
• \`/artist [Nama]\` \\- Info artis
• \`/similar [Judul]\` \\- Rekomendasi lagu
• \`/history\` \\- Riwayat unduhan

*7\\. Troubleshooting:*
• Pastikan URL YouTube valid
• Cek koneksi internet Anda
• Tunggu beberapa saat jika server sibuk

*Butuh bantuan lebih lanjut?*
Hubungi: @Yourboy8w
Join grup support: @MusicBotSupport`;
    }

    static formatErrorMessage(error, context) {
        return `
❌ *Error Terdeteksi*
${this.escapeMarkdown(error.message)}

*Konteks:* ${this.escapeMarkdown(context)}
*Error Code:* ${error.code || 'Unknown'}

Silakan coba:
1\\. Periksa format perintah Anda
2\\. Tunggu beberapa saat
3\\. Coba lagi nanti

Butuh bantuan? Gunakan /help`;
    }

    static formatSearchResults(results, query) {
        return `
🔍 *Hasil Pencarian*
Untuk: "${this.escapeMarkdown(query)}"

${results.map((result, index) => `
${index + 1}\\. *${this.escapeMarkdown(result.title)}*
👤 Artis: ${this.escapeMarkdown(result.artist)}
⏱ Durasi: ${result.duration}
👁 Views: ${result.views.toLocaleString()}
🔗 ID: \`${result.id}\`
`).join('\n')}

Untuk mengunduh: /download [URL]
Untuk info lanjut: /info [ID]`;
    }

    static formatStatusMessage(stats) {
        const uptime = this.formatUptime(stats.uptime);
        const memory = Math.round(stats.memory.heapUsed / 1024 / 1024);
        
        return `
📊 *Status Bot*

*Sistem:*
⏱ Uptime: ${uptime}
💾 Memory: ${memory}MB
📥 Downloads: ${stats.downloads}

*Statistik Hari Ini:*
👥 Users: ${stats.dailyUsers}
⬇️ Unduhan: ${stats.dailyDownloads}
🔍 Pencarian: ${stats.dailySearches}

*Performa:*
📶 Server Load: ${stats.serverLoad}%
⚡ Response Time: ${stats.responseTime}ms

*Status Server:* ${this.getServerStatus(stats.serverLoad)}`;
    }

    static formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        
        return parts.join(' ');
    }

    static getServerStatus(load) {
        if (load < 50) return "✅ Optimal";
        if (load < 80) return "⚠️ Moderate Load";
        return "🔴 Heavy Load";
    }

    static formatPlaylistInfo(playlist) {
        return `
🎵 *Playlist: ${this.escapeMarkdown(playlist.name)}*

📊 *Info:*
• Total Lagu: ${playlist.songs.length}
• Dibuat: ${playlist.createdAt.toLocaleDateString()}
• Update: ${playlist.updatedAt.toLocaleDateString()}

*Daftar Lagu:*
${playlist.songs.map((song, index) => `
${index + 1}\\. *${this.escapeMarkdown(song.title)}*
👤 ${this.escapeMarkdown(song.artist)}
⏱ ${song.duration}
`).join('\n')}

*Perintah:*
• Putar: /play ${this.escapeMarkdown(playlist.name)}
• Tambah: /addtoplaylist ${this.escapeMarkdown(playlist.name)} [URL]
• Hapus: /removefromplaylist ${this.escapeMarkdown(playlist.name)} [nomor]`;
    }
}

module.exports = MessageFormatter;