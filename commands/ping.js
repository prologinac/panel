module.exports = {
    name: "ping",
    alias: ["p"],
    description: "Check bot response speed and status.",
    category: "main",

    execute: async (sock, chatId, message, args, { pushname }) => {     
        const start = Date.now();
       const { key } = await sock.sendMessage(chatId, { 
            text: `*🚀 MADRIN-MD Testing...*` 
        }, { quoted: message });
        const end = Date.now();
        const responseTime = end - start;
        await sock.sendMessage(chatId, { 
            text: `*⚡ PONG!* \n\n> *User:* ${pushname}\n> *Speed:* ${responseTime}ms\n> *Status:* Online ✅`,
            edit: key
        });
    }
};

