require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { cariLagu } = require('./pencarian_lagu');
const { downloadLagu } = require('./download_lagu');
// require('node-fetch');
const { deepseekBot } = require('./botDeepseek');



// Konfigurasi Bot
const config = {
    downloadPath: './downloads',
    maxDownloadSize: 50 * 1024 * 1024, // 50MB (Telegram limit)
    cleanupInterval: 3600000, // 1 jam dalam ms
    maxRetries: 3,
    downloadTimeout: 300000 // 5 menit
};

// Membuat direktori download jika belum ada
if (!fs.existsSync(config.downloadPath)) {
    fs.mkdirSync(config.downloadPath, { recursive: true });
}

// Inisialisasi bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Middleware untuk logging
bot.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    console.log('Response time: %sms', ms);
});

// Utility functions
const cleanupDownloads = () => {
    const files = fs.readdirSync(config.downloadPath);
    files.forEach(file => {
        const filePath = path.join(config.downloadPath, file);
        const stats = fs.statSync(filePath);
        const fileAge = new Date() - stats.mtime;
        if (fileAge > config.cleanupInterval) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up: ${file}`);
        }
    });
};

// Setup periodic cleanup
setInterval(cleanupDownloads, config.cleanupInterval);

// Command Handlers
bot.start((ctx) => {
    const firstName = ctx.from.first_name || 'Pengguna';
    const welcomeMessage = `
Halo, ${firstName}! 🎵

Saya adalah bot pencari dan pengunduh musik. Berikut perintah yang tersedia:

1. /lagu [Judul Lagu] - Mencari lagu {  dalam tahap pengembangan }}
2. /download [URL YouTube] - Mengunduh lagu
3. /help - Menampilkan bantuan { dalam tahap pengembangan }
4. /status - Cek status bot
5 /deepseek - Mencari informasi lebih dalam mengenai lagu { dalam tahap pengembangan }

Tips: Untuk hasil terbaik, sertakan nama artis dalam pencarian!
`;
    return ctx.reply(welcomeMessage);
});

bot.help((ctx) => {
    const helpMessage = `
🎵 *Panduan Penggunaan Bot* 🎵

*Perintah Dasar:*
• \`/lagu [Judul]\` \\- Mencari lagu
• \`/download [URL]\` \\- Mengunduh lagu
• \`/status\` \\- Cek status bot

*Format Pencarian yang Baik:*
• \`/lagu Judul \\- Artis\`
• \`/lagu Nama Album \\- Artis\`

*Bot Deepseek:*
• \`/deepseek [Pertanyaan]\`
 
*Catatan:*
• Ukuran maksimal unduhan: 50MB
• Format yang didukung: MP3
• Waktu unduhan maksimal: 5 menit

*Butuh bantuan?*
Hubungi: @Yourboy8w`;

    return ctx.replyWithMarkdown(helpMessage, {
        parse_mode: 'MarkdownV2'
    });
});

bot.command('status', async (ctx) => {
    try {
        const stats = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            downloads: fs.readdirSync(config.downloadPath).length
        };

        const statusMessage = `
🤖 *Status Bot*
⏱ Uptime: ${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m
💾 Memory: ${Math.round(stats.memory.heapUsed / 1024 / 1024)}MB used
📁 Active Downloads: ${stats.downloads}
        `;
        
        return ctx.replyWithMarkdown(statusMessage);
    } catch (error) {
        console.error('Status error:', error);
        return ctx.reply('Gagal mengambil status bot.');
    }
});


// Bot command handler
bot.command('deepseek', async (ctx) => {
    try {
        const messageText = ctx.message.text;
        const match = messageText.match(/\/deepseek (.+)/);
        
        if (!match) {
            return ctx.reply('❌ Format salah. Gunakan: /deepseek [Pertanyaan]');
        }

        const query = match[1];
        
        // Status message
        const statusMsg = await ctx.reply('🤔 Sedang berpikir...');
        
        // Get response
        const response = await deepseekBot(ctx, query);
        
        // Update message with response
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            response
        );

    } catch (error) {
        console.error('Command error:', error);
        return ctx.reply('❌ Terjadi kesalahan saat memproses perintah.');
    }
});

// Command untuk mencari lagu
bot.command('lagu', async (ctx) => {
    const messageText = ctx.message.text;
    const match = messageText.match(/\/lagu (.+)/);

    if (!match) {
        return ctx.reply('❌ Format salah. Gunakan: /lagu [Judul Lagu - Artis]');
    }

    const judulLagu = match[1];
    const searchMessage = await ctx.reply(`🔍 Mencari: "${judulLagu}"...`);

    try {
        const hasil = await cariLagu(judulLagu);
        
        if (hasil.totalResults === 0) {
            return ctx.telegram.editMessageText(
                ctx.chat.id,
                searchMessage.message_id,
                null,
                '❌ Tidak ditemukan hasil yang cocok.'
            );
        }

        // Tambahkan header dan footer
        const response = 
            `🎵 *Hasil Pencarian*\n` +
            `Untuk: "${escapeMarkdown(judulLagu)}"\n\n` +
            `${hasil.formattedResults}\n\n` +
            `📥 Untuk mengunduh, gunakan perintah /download [URL]`;

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            searchMessage.message_id,
            null,
            response,
            { 
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true 
            }
        );

    } catch (error) {
        console.error('Search error:', error);
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            searchMessage.message_id,
            null,
            '❌ Terjadi kesalahan saat mencari lagu. Silakan coba lagi.'
        );
    }
});

// Command untuk mengunduh lagu
bot.command('download', async (ctx) => {
    const messageText = ctx.message.text;
    const match = messageText.match(/\/download (https:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+)/);

    if (!match) {
        return ctx.reply('❌ Format salah! Gunakan: /download [URL YouTube]');
    }

    const videoUrl = match[1];
    const statusMessage = await ctx.reply('⏳ Memulai unduhan...');
    let filePath = null;

    try {
        // Set timeout untuk download
        const downloadPromise = downloadLagu(videoUrl, 'mp3');
        filePath = await Promise.race([
            downloadPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Download timeout')), config.downloadTimeout)
            )
        ]);

        // Update status
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '📤 Mengunggah file...'
        );

        // Kirim file
        await ctx.replyWithDocument(
            { source: filePath },
            { caption: '✅ Unduhan selesai!' }
        );

    } catch (error) {
        console.error('Download error:', error);
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            `❌ Gagal mengunduh: ${error.message}`
        );
    } finally {
        // Cleanup
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

// Error handler
bot.catch((err, ctx) => {
    console.error(`Bot error for ${ctx.updateType}:`, err);
    // ctx.reply('Maaf, terjadi kesalahan internal. Silakan coba lagi nanti.');
});

// Launching bot
const startBot = async () => {
    try {
        await bot.launch();
        console.log('🤖 Bot is running...');
        
        // Setup cleanup on shutdown
        process.once('SIGINT', () => {
            console.log('Bot shutting down...');
            cleanupDownloads();
            bot.stop('SIGINT');
        });
        process.once('SIGTERM', () => {
            console.log('Bot shutting down...');
            cleanupDownloads();
            bot.stop('SIGTERM');
        });
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
};

startBot();
// Export bot for testing