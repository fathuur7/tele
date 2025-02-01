const ytsr = require('ytsr');

/**
 * Konfigurasi default untuk pencarian
 */
const DEFAULT_SEARCH_CONFIG = {
    limit: 5,
    maxRetries: 2,
    minDuration: 0,        // dalam detik
    maxDuration: 600,      // 10 menit dalam detik
    filterLive: true,      // filter live streams
    includeMetadata: true  // tambahkan metadata tambahan
};

/**
 * Format durasi dari detik ke format mm:ss
 * @param {number} seconds - Durasi dalam detik
 * @returns {string} Format durasi mm:ss
 */
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Memformat jumlah views ke format yang lebih readable
 * @param {number} views - Jumlah views
 * @returns {string} Format views yang readable
 */
function formatViews(views) {
    if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
}

/**
 * Filter hasil pencarian berdasarkan kriteria
 * @param {Object} item - Item hasil pencarian
 * @param {Object} config - Konfigurasi pencarian
 * @returns {boolean} True jika item memenuhi kriteria
 */
function filterSearchResult(item, config) {
    if (item.type !== 'video') return false;
    if (config.filterLive && item.isLive) return false;
    
    const duration = item.duration ? parseDuration(item.duration) : 0;
    if (duration < config.minDuration || duration > config.maxDuration) return false;
    
    return true;
}

/**
 * Parse durasi dari format "mm:ss" ke detik
 * @param {string} duration - Durasi dalam format mm:ss
 * @returns {number} Durasi dalam detik
 */
function parseDuration(duration) {
    if (!duration) return 0;
    const parts = duration.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}

/**
 * Mencari lagu di YouTube dengan fitur yang lebih lengkap
 * @param {string} query - Query pencarian
 * @param {Object} options - Opsi pencarian
 * @returns {Promise<Object>} Hasil pencarian
 */
async function cariLagu(query, options = {}) {
    // Validasi input
    if (!query || typeof query !== 'string') {
        throw new Error('Query pencarian harus berupa string.');
    }

    // Merge dengan default config
    const config = {
        ...DEFAULT_SEARCH_CONFIG,
        ...options
    };

    let attempts = 0;
    let error = null;
    while (attempts < config.maxRetries) {
        try {
            // Tambahkan "audio" atau "music" ke query untuk hasil yang lebih relevan
            const searchQuery = query.toLowerCase().includes('music') ? query : `${query} music`;
            
            // Lakukan pencarian
            const hasil = await ytsr(searchQuery, { limit: config.limit * 2 }); // Ambil lebih banyak untuk filtering

            // Filter dan format hasil
            const hasilFiltered = hasil.items
                .filter(item => filterSearchResult(item, config))
                .slice(0, config.limit)
                .map((item, index) => {
                    const baseInfo = {
                        id: index + 1,
                        title: item.title,
                        url: item.url,
                        thumbnail: item.thumbnails?.[0]?.url || null,
                        duration: item.duration || 'N/A',
                        author: item.author?.name || 'Unknown',
                        authorUrl: item.author?.url || null
                    };

                    // Tambahkan metadata tambahan jika diminta
                    if (config.includeMetadata) {
                        return {
                            ...baseInfo,
                            views: formatViews(item.views),
                            uploadedAt: item.uploadedAt,
                            description: item.description?.slice(0, 100) + '...',
                            durationInSeconds: parseDuration(item.duration)
                        };
                    }

                    return baseInfo;
                });

            // Return hasil dengan format yang lebih informatif
            return {
                success: true,
                query: searchQuery,
                totalResults: hasilFiltered.length,
                results: hasilFiltered,
                formattedResults: hasilFiltered
                    .map(item => {
                        return `${item.id}. ${item.title}\n` +
                               `👤 ${item.author} | ⏱️ ${item.duration}${item.views ? ` | 👁️ ${item.views}` : ''}\n` +
                               `🔗 ${item.url}`;
                    })
                    .join('\n\n')
            };

        } catch (err) {
            error = err;
            attempts++;
            
            // Tunggu sebentar sebelum retry
            if (attempts < config.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }
    }

    // Jika semua attempts gagal
    throw new Error(`Gagal mencari lagu setelah ${config.maxRetries} percobaan: ${error.message}`);
}

module.exports = {
    cariLagu,
    DEFAULT_SEARCH_CONFIG
};