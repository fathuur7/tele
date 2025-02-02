const ytsr = require('ytsr');

// Konfigurasi default
const DEFAULT_SEARCH_CONFIG = {
    limit: 10,
    maxRetries: 2,
    minDuration: 0,
    maxDuration: 600,
    filterLive: true,
    includeMetadata: true
};

// Fungsi untuk memvalidasi hasil pencarian
function isValidSearchResult(item) {
    return (
        item &&
        typeof item === 'object' &&
        item.type && // pastikan ada tipe
        item.title && // pastikan ada judul
        item.url && // pastikan ada URL
        (item.type === 'video' || item.type === 'shortVideo') // pastikan tipe yang valid
    );
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
                limit: config.limit * 4, // Tingkatkan limit untuk antisipasi hasil yang tidak valid
                safeSearch: true,
                gl: 'ID' // Lokasi Indonesia
            };
            
            const hasil = await ytsr(searchQuery, searchOptions);

            // Filter dan validasi hasil
            const hasilFiltered = (hasil.items || [])
                .filter(item => {
                    try {
                        return isValidSearchResult(item) && filterSearchResult(item, config);
                    } catch (e) {
                        console.warn('Item filtering error:', e);
                        return false;
                    }
                })
                .slice(0, config.limit)
                .map((item, index) => {
                    try {
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
                    } catch (e) {
                        console.warn('Item mapping error:', e);
                        return null;
                    }
                })
                .filter(item => item !== null); // Hapus item yang gagal di-map

            // Jika tidak ada hasil yang valid
            if (hasilFiltered.length === 0) {
                throw new Error('Tidak ada hasil pencarian yang valid ditemukan.');
            }

            // Format hasil untuk Telegram
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
            console.error(`Attempt ${attempts + 1} failed:`, err);
            lastError = err;
            attempts++;
            
            if (attempts < config.maxRetries) {
                // Tambah jeda waktu antara percobaan
                const delayMs = 1000 * Math.pow(2, attempts); // exponential backoff
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    // Jika semua percobaan gagal
    throw new Error(`Gagal mencari lagu setelah ${config.maxRetries} percobaan. Mohon coba lagi nanti.`);
}

// Helper functions remain the same
function escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function formatViews(views) {
    if (!views) return '';
    if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
}

function parseDuration(duration) {
    if (!duration || typeof duration !== 'string') return 0;
    const parts = duration.split(':');
    if (parts.length === 2) {
        return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
    }
    return 0;
}

function filterSearchResult(item, config) {
    if (!item || typeof item !== 'object') return false;
    if (!item.type || (item.type !== 'video' && item.type !== 'shortVideo')) return false;
    if (config.filterLive && item.isLive) return false;
    
    const duration = item.duration ? parseDuration(item.duration) : 0;
    return duration >= config.minDuration && duration <= config.maxDuration;
}

module.exports = {
    cariLagu,
    DEFAULT_SEARCH_CONFIG
};