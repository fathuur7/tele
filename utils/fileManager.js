const fs = require('fs');
const path = require('path');

class FileManager {
    static createDownloadDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    static cleanupDownloads(downloadPath, maxAge) {
        const files = fs.readdirSync(downloadPath);
        files.forEach(file => {
            const filePath = path.join(downloadPath, file);
            const stats = fs.statSync(filePath);
            const fileAge = new Date() - stats.mtime;
            if (fileAge > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up: ${file}`);
            }
        });
    }
}

module.exports = FileManager;