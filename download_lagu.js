const ytdl = require('@distube/ytdl-core'); // Menggunakan alternatif yang lebih stabil
const fs = require('fs');
const path = require('path');

async function downloadLagu(videoUrl, format = 'mp3') {
    try {
        if (!ytdl.validateURL(videoUrl)) {
            throw new Error('URL YouTube tidak valid.');
        }

        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[<>:"/\\|?*]+/g, '');
        const fileExtension = format === 'mp3' ? 'mp3' : 'mp4';
        const filePath = path.resolve(__dirname, `${title}.${fileExtension}`);
        // masukann dalam file donwload 
        const downloadPath = path.join(__dirname, 'downloads');
        if (!fs.existsSync(downloadPath)) {
            fs.mkdirSync(downloadPath);
        }

        const stream = ytdl(videoUrl, {
            filter: format === 'mp3' ? 'audioonly' : 'videoandaudio',
            quality: format === 'mp3' ? 'highestaudio' : 'highest',
            dlChunkSize: 0,
        }).pipe(fs.createWriteStream(filePath));

        return new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(filePath));
            stream.on('error', (err) => reject(`Error saat menyimpan file: ${err.message}`));
        });

    } catch (error) {
        console.error('Gagal mengunduh lagu:', error);
        throw new Error(`Gagal mengunduh lagu: ${error.message}`);
    }
}

module.exports = { downloadLagu };
