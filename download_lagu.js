const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipe = promisify(pipeline);

async function downloadLagu(videoUrl, format = 'mp3', progressCallback = () => {}) {
    try {
        if (!ytdl.validateURL(videoUrl)) {
            throw new Error('URL YouTube tidak valid.');
        }

        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[<>:"/\\|?*]+/g, '');
        const fileExtension = format === 'mp3' ? 'mp3' : 'mp4';
        const downloadPath = path.join(__dirname, 'downloads');

        if (!fs.existsSync(downloadPath)) {
            fs.mkdirSync(downloadPath);
        }

        const filePath = path.join(downloadPath, `${title}.${fileExtension}`);

        const options = {
            filter: format === 'mp3' ? 'audioonly' : 'videoandaudio',
            quality: format === 'mp3' ? 'highestaudio' : 'highestvideo',
            highWaterMark: 1 << 25 // Buffer 32MB untuk streaming lebih cepat
        };

        const stream = ytdl(videoUrl, options);
        let downloaded = 0;
        const totalSize = parseInt(info.videoDetails.lengthSeconds) * 128 * 1024; // Estimasi ukuran audio 128kbps

        stream.on('data', (chunk) => {
            downloaded += chunk.length;
            const progress = Math.min(100, Math.floor((downloaded / totalSize) * 100));
            if (progress % 5 === 0) { // Update setiap 5% untuk mengurangi beban API
                progressCallback(progress);
            }
        });

        await pipe(stream, fs.createWriteStream(filePath));

        return filePath;

    } catch (error) {
        console.error('Gagal mengunduh lagu:', error);
        throw new Error(`Gagal mengunduh lagu: ${error.message}`);
    }
}

module.exports = { downloadLagu };

