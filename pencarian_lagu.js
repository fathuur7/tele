const ytsr = require('ytsr');

// Konfigurasi default tetap sama
const DEFAULT_SEARCH_CONFIG = {
    limit: 5,
    maxRetries: 2,
    minDuration: 0,
    maxDuration: 600,
    filterLive: true,
    includeMetadata: true
};

// Tambahkan fungsi escape untuk Markdown Telegram
function escapeMarkdown(text) {
    return text
        .replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// Fungsi format durasi dan views tetap sama
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatViews(views) {
    if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || '0';
}

function filterSearchResult(item, config) {
    // Tambahkan pengecekan tipe yang lebih ketat
    if (!item || typeof item !== 'object') return false;
    if (item.type !== 'video' && item.type !== 'shortVideo') return false;
    if (config.filterLive && item.isLive) return false;
    
    // Penanganan durasi yang lebih baik
    const duration = item.duration ? parseDuration(item.duration) : 0;
    return duration >= config.minDuration && duration <= config.maxDuration;
}

function parseDuration(duration) {
    if (!duration || typeof duration !== 'string') return 0;
    const parts = duration.split(':');
    if (parts.length === 2) {
        return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
    }
    return 0;
}

async function cariLagu(query, options = {}) {
    if (!query || typeof query !== 'string') {
        throw new Error('Query pencarian harus berupa string.');
    }

    const config = {
        ...DEFAULT_SEARCH_CONFIG,
        ...options
    };

    let attempts = 0;
    let lastError = null;

    while (attempts < config.maxRetries) {
        try {
            const searchQuery = query.toLowerCase().includes('music') ? 
                query : `${query} music`;
            
            // Tambahkan options untuk ytsr
            const searchOptions = {
                limit: config.limit * 2,
                safeSearch: true
            };
            
            const hasil = await ytsr(searchQuery, searchOptions);

            const hasilFiltered = hasil.items
                .filter(item => filterSearchResult(item, config))
                .slice(0, config.limit)
                .map((item, index) => {
                    const safeTitle = escapeMarkdown(item.title);
                    const safeAuthor = escapeMarkdown(item.author?.name || 'Unknown');
                    
                    const baseInfo = {
                        id: index + 1,
                        title: safeTitle,
                        url: item.url,
                        thumbnail: item.thumbnails?.[0]?.url || null,
                        duration: item.duration || 'N/A',
                        author: safeAuthor,
                        authorUrl: item.author?.url || null
                    };

                    if (config.includeMetadata) {
                        return {
                            ...baseInfo,
                            views: formatViews(item.views),
                            uploadedAt: item.uploadedAt,
                            description: item.description ? 
                                escapeMarkdown(item.description.slice(0, 100)) + '...' : '',
                            durationInSeconds: parseDuration(item.duration)
                        };
                    }

                    return baseInfo;
                });

            // Format yang aman untuk Telegram
            const formattedResults = hasilFiltered
                .map(item => (
                    `${item.id}\\. *${item.title}*\n` +
                    `👤 ${item.author} \\| ⏱️ ${item.duration}${item.views ? ` \\| 👁️ ${item.views}` : ''}\n` +
                    `🔗 [Link Video](${item.url})`
                ))
                .join('\n\n');

            return {
                success: true,
                query: searchQuery,
                totalResults: hasilFiltered.length,
                results: hasilFiltered,
                formattedResults
            };

        } catch (err) {
            lastError = err;
            attempts++;
            
            if (attempts < config.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }
    }

    throw new Error(`Gagal mencari lagu setelah ${config.maxRetries} percobaan: ${lastError?.message}`);
}

module.exports = {
    cariLagu,
    DEFAULT_SEARCH_CONFIG
};