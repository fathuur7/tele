const { cariLagu } = require('../services/pencarian_lagu');
const { downloadLagu } = require('../services/download_lagu');
const { deepseekBot } = require('../services/botDeepseek');
const MessageFormatter = require('../utils/messageFormatter');
const fs = require('fs');
const config = require('../config/config');

class CommandHandlers {
    static async handleStart(ctx) {
        const firstName = ctx.from.first_name || 'Pengguna';
        return ctx.reply(MessageFormatter.formatWelcomeMessage(firstName));
    }

    static async handleHelp(ctx) {
        return ctx.replyWithMarkdown(MessageFormatter.formatHelpMessage(), {
            parse_mode: 'MarkdownV2'
        });
    }

    static async handleStatus(ctx) {
        try {
            const stats = {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                downloads: fs.readdirSync(config.download.path).length
            };

            const statusMessage = `
🤖 *Status Bot*
⏱ Uptime: ${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m
💾 Memory: ${Math.round(stats.memory.heapUsed / 1024 / 1024)}MB used
📁 Active Downloads: ${stats.downloads}`;
            
            return ctx.replyWithMarkdown(statusMessage);
        } catch (error) {
            console.error('Status error:', error);
            return ctx.reply('Gagal mengambil status bot.');
        }
    }

    static async handleAi(ctx) {
        try {
            const match = ctx.message.text.match(/\/Ai (.+)/);
            
            if (!match) {
                return ctx.reply('❌ Format salah. Gunakan: /Ai [Pertanyaan]');
            }

            const statusMsg = await ctx.reply('🤔 Sedang berpikir...');
            const response = await deepseekBot(ctx, match[1]);
            
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                response
            );
        } catch (error) {
            console.error('AI command error:', error);
            return ctx.reply('❌ Terjadi kesalahan saat memproses perintah.');
        }
    }

    static async handleSongSearch(ctx) {
        const match = ctx.message.text.match(/\/lagu (.+)/);
        console.log(match);


        if (!match) {
            return ctx.reply('❌ Format salah. Gunakan: /lagu [Judul Lagu - Artis]');
        }

        const searchMessage = await ctx.reply(`🔍 Mencari: "${match[1]}"...`);

        try {
            const hasil = await cariLagu(match[1]);
            console.log(hasil);
            
            if (hasil.totalResults === 0) {
                return ctx.telegram.editMessageText(
                    ctx.chat.id,
                    searchMessage.message_id,
                    null,
                    '❌ Tidak ditemukan hasil yang cocok.'
                );
            }

            const formattedResults = `🎵 *Hasil Pencarian*\n\n${hasil.formattedResults}\n\n📥 Untuk mengunduh, gunakan perintah /download [URL]`;
            
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                searchMessage.message_id,
                null,
                formattedResults,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Search error:', error);
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                searchMessage.message_id,
                null,
                '❌ Terjadi kesalahan saat mencari lagu.'
            );
        }
    }

    static async handleDownload(ctx, config) {
        const match = ctx.message.text.match(/\/download (https:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+)/);
        console.log(match);

        if (!match) {
            return ctx.reply('❌ Format salah! Gunakan: /download [URL YouTube]');
        }

        const statusMessage = await ctx.reply('⏳ Memulai unduhan...');
        let filePath = null;

        try {
            filePath = await Promise.race([
                downloadLagu(match[1], 'mp3', async (progress) => {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        statusMessage.message_id,
                        null,
                        `⏳ Mengunduh: ${progress}%`
                    ).catch(() => {});
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Download timeout - coba lagi nanti')), 
                    config.download.timeout)
                )
            ]);

            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMessage.message_id,
                null,
                '📤 Mengunggah file...'
            );

            await ctx.replyWithDocument(
                { source: filePath },
                { caption: '✅ Unduhan selesai!' }
            );

            console.log('Download complete:', filePath);
        } catch (error) {
            console.error('Download error:', error);
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMessage.message_id,
                null,
                `❌ Gagal mengunduh: ${error.message}`
            );
        } finally {
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }
}

module.exports = CommandHandlers;