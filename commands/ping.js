module.exports = {
    name: "ping",
    alias: ["p"],
    description: "Check bot response speed and status.",
    category: "main",

    execute: async (sock, chatId, message, args, { pushname }) => {

        // Calculate speed

        const start = Date.now();
        // Initial response
       const { key } = await sock.sendMessage(chatId, { 
            text: `*🚀 MADRIN-MD Testing...*` 
        }, { quoted: message });
        const end = Date.now();
        const responseTime = end - start;
        // Edit the message with the final result
        await sock.sendMessage(chatId, { 
            text: `*⚡ PONG!* \n\n> *User:* ${pushname}\n> *Speed:* ${responseTime}ms\n> *Status:* Online ✅`,
            edit: key
        });
    }
};

