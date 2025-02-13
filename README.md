# Telegram Music Bot 🎵

A feature-rich Telegram bot for searching, downloading, and managing music playlists. Built with Node.js and the Telegraf framework.

## Features ✨

- Search and download music tracks
- Create and manage personal playlists
- View trending music
- AI-powered music recommendations
- Automatic file cleanup
- Performance monitoring

## Prerequisites 📋

- Node.js (v14 or higher)
- MongoDB
- Telegram Bot Token

## Installation 🚀

1. Clone the repository:
```bash
git clone [https://github.com/fathuur7/tele.git]
cd tele
```

2. Install dependencies:
```bash
npm install
```

3. Create a config file `config/config.js`:
```javascript
module.exports = {
    bot: {
        token: 'YOUR_BOT_TOKEN'
    },
    download: {
        path: './downloads',
        cleanupInterval: 3600000 // 1 hour
    }
    // Add other configuration options
};

and if wnat make playlist must have database 
```

## Usage 💻

Start the bot:
```bash
npm start
```

### Available Commands

- `/start` - Initialize the bot
- `/help` - Display help information
- `/status` - Check bot status
- `/Ai` - Get AI music recommendations
- `/lagu` - Search for songs
- `/download` - Download a song
- `/createplaylist` - Create a new playlist
- `/showplaylists` - View your playlists
- `/addtoplaylist` - Add a song to playlist
- `/trending` - View trending songs

## Project Structure 📁

```
├── config/
│   └── config.js
├── handlers/
│   ├── commandHandlers.js
│   └── PlaylistHandlers.js
├── services/
│   └── PlaylistStorageDB.js
├── utils/
│   └── fileManager.js
└── index.js
```

## Features in Detail 🔍

### Music Search and Download
- Search for music tracks using keywords
- Download tracks with automatic file management

### Playlist Management
- Create personal playlists
- Add songs to existing playlists
- View all playlists

### File Management
- Automatic cleanup of downloaded files
- Configurable cleanup intervals
- Download directory management

### Performance Monitoring
- Response time logging
- Error handling and logging
- Graceful shutdown handling

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [Telegraf](https://github.com/fathuur7/tele.git) - Modern Telegram Bot Framework for Node.js
- All contributors who help improve this project

## Contact 📧

Your Name - [@Yourboy8w](https://telegram.me/@Yourboy8w)

Project Link: [https://github.com/fathuur7/tele.git](https://github.com/fathuur7/tele.git)
