const { Telegraf } = require('telegraf');
const config = require('./config/config');
const FileManager = require('./utils/fileManager');
const CommandHandlers = require('./handlers/commandHandlers');
const PlaylistStorageDB = require('./services/PlaylistStorageDB');
const PlaylistHandlers = require('./handlers/PlaylistHandlers');

class MusicBot {
    constructor() {
        this.bot = new Telegraf(config.bot.token);
        this.setupMiddleware();
        this.setupCommands();
        this.setupErrorHandler();
        this.playlistStorage = new PlaylistStorageDB();
        this.playlistHandlers = new PlaylistHandlers(this.playlistStorage);
    }

    setupMiddleware() {
        this.bot.use(async (ctx, next) => {
            const start = new Date();
            await next();
            const ms = new Date() - start;
            console.log('Response time: %sms', ms);
        });
    }

    setupCommands() {
        this.bot.start(CommandHandlers.handleStart);
        this.bot.help(CommandHandlers.handleHelp);
        this.bot.command('status', CommandHandlers.handleStatus);
        this.bot.command('Ai', CommandHandlers.handleAi);
        this.bot.command('lagu', CommandHandlers.handleSongSearch);
        this.bot.command('download', (ctx) => CommandHandlers.handleDownload(ctx, config));
        this.bot.command('createplaylist', (ctx) => this.playlistHandlers.handleCreatePlaylist(ctx));
        this.bot.command('showplaylists', (ctx) => this.playlistHandlers.handleShowPlaylists(ctx));
        this.bot.command('addtoplaylist', (ctx) => this.playlistHandlers.handleAddToPlaylist(ctx));
        this.bot.command('trending', (ctx) => this.playlistHandlers.handleTrending(ctx));
    }

    setupErrorHandler() {
        this.bot.catch((err, ctx) => {
            console.error(`Bot error for ${ctx.updateType}:`, err);
        });
    }

    async start() {
        try {
            FileManager.createDownloadDirectory(config.download.path);
            setInterval(() => {
                FileManager.cleanupDownloads(config.download.path, config.download.cleanupInterval);
            }, config.download.cleanupInterval);

            await this.bot.launch();
            console.log('🤖 Bot is running...');
            
            this.setupShutdownHandlers();
        } catch (error) {
            console.error('Failed to start bot:', error);
            process.exit(1);
        }
    }

    setupShutdownHandlers() {
        const cleanup = () => {
            console.log('Bot shutting down...');
            FileManager.cleanupDownloads(config.download.path, 0);
            this.bot.stop('SIGTERM');
        };

        process.once('SIGINT', cleanup);
        process.once('SIGTERM', cleanup);
    }
}

const bot = new MusicBot();
bot.start();