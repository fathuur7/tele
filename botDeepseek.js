// require('node-fetch');

// async function deepseekBot(ctx, query) {
//     try {
//         // Show typing indicator while processing
//         await ctx.sendChatAction('typing');
        
//         // Call Ollama API using fetch
//         const response = await fetch('http://localhost:11434/api/chat', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 model: 'deepseek-coder:1.3b',
//                 messages: [{
//                     role: 'user',
//                     content: query
//                 }]
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
        
//         if (!data.message || !data.message.content || data.message.content.trim() === '') {
//             return '❌ Maaf, tidak ada jawaban yang ditemukan.';
//         }

//         return data.message.content;

//     } catch (error) {
//         console.error('DeepseekBot Error:', error);
//         return '❌ Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.';
//     }
// }

// module.exports = { deepseekBot };