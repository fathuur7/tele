const { Ollama } = require('ollama');

// Menyimpan penggunaan user
const userUsage = new Map();

// Fungsi untuk mengecek dan memperbarui limit penggunaan
function checkAndUpdateLimit(userId) {
    const MAX_USAGE = 5;
    const currentUsage = userUsage.get(userId) || 0;
    
    if (currentUsage >= MAX_USAGE) {
        return false;
    }
    
    userUsage.set(userId, currentUsage + 1);
    return true;
}

// Fungsi untuk mendapatkan sisa penggunaan
function getRemainingUsage(userId) {
    const MAX_USAGE = 5;
    const currentUsage = userUsage.get(userId) || 0;
    return MAX_USAGE - currentUsage;
}

async function deepseekBot(ctx, query) {
    try {
        const userId = ctx.from.id;
        
        // Cek limit penggunaan
        if (!checkAndUpdateLimit(userId)) {
            return '⚠️ Maaf, Anda telah mencapai batas maksimum penggunaan (5 kali).\nSilakan coba lagi besok!';
        }
        
        const remainingUsage = getRemainingUsage(userId);
        
        const ollama = new Ollama();
        
        // Tambahkan instruksi khusus ke query
        const enhancedQuery = `Sebagai AI yang ramah dan membantu, tolong berikan jawaban yang ringkas, informatif, dan mudah dipahami untuk pertanyaan berikut: ${query}`;
        
        const response = await ollama.chat({
            model: 'deepseek-r1:8b',
            messages: [{ 
                role: 'user', 
                content: enhancedQuery 
            }]
        });
        
        // Proses dan format response
        let formattedResponse = response.message.content;

        // menghapus thinking ,isi nya dan end of thinking 
        formattedResponse = formattedResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
        
        // Filter kata-kata yang menunjukkan ketidakpastian
        const uncertaintyWords = [
            'mungkin', 'sepertinya', 'kemungkinan',
            'bisa jadi', 'barangkali', 'kira-kira',
            'seharusnya', 'sekiranya'
        ];
        
        uncertaintyWords.forEach(word => {
            formattedResponse = formattedResponse.replace(
                new RegExp(word, 'gi'),
                ''
            );
        });
        
        // Tambahkan emoji dan formatting yang relevan
        formattedResponse = formattedResponse
            .replace(/\b(penting|perhatian|catatan)\b/gi, '⚠️ $1')
            .replace(/\b(sukses|berhasil)\b/gi, '✅ $1')
            .replace(/\b(gagal|error)\b/gi, '❌ $1')
            .replace(/\b(ide|pemikiran)\b/gi, '💡 $1')
            .replace(/\b(waktu|jadwal)\b/gi, '⏰ $1')
            .replace(/\b(informasi|info)\b/gi, 'ℹ️ $1');
            
        // Tambahkan footer yang menarik dengan info penggunaan tersisa
        formattedResponse = `${formattedResponse.trim()}\n\n📊 Sisa penggunaan: ${remainingUsage} kali\n🤖 _Powered by DeepSeek AI_`;
        
        return formattedResponse;

    } catch (error) {
        console.error('Deepseek error:', error);
        return '❌ Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi nanti.';
    }
}

// Reset penggunaan setiap hari pada pukul 00:00
function resetDailyUsage() {
    userUsage.clear();
    console.log('Usage limits reset for all users');
}

// Jalankan reset setiap hari pada pukul 00:00
const scheduleDailyReset = () => {
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // tomorrow
        0, // 00 hours
        0, // 00 minutes
        0  // 00 seconds
    );
    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(() => {
        resetDailyUsage();
        // Setup next reset
        setInterval(resetDailyUsage, 24 * 60 * 60 * 1000);
    }, msToMidnight);
};

// Mulai penjadwalan reset
scheduleDailyReset();

module.exports = { deepseekBot };
