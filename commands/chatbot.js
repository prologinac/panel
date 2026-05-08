module.exports = {
    name: "chatbot",
    alias: ["ai"],
    category: "owner",
    async execute(sock, chatId, msg, args, { isOwner }) {
        if (!isOwner) return;

        const target = args[0]?.toLowerCase();
        const status = args[1]?.toLowerCase(); 

        if (!target || !status) {
            return sock.sendMessage(chatId, { text: "*Usage:* .chatbot [dm/gc] [on/off]" });
        }

        const state = (status === 'on');
        
        if (target === 'dm') {
            global.chatbot.dm = state;
            await sock.sendMessage(chatId, { text: `Chatbot for DMs is now ${status.toUpperCase()}` });
        } else if (target === 'gc') {
            global.chatbot.gc = state;
            await sock.sendMessage(chatId, { text: `Chatbot for Groups is now ${status.toUpperCase()}` });
        }
    }
};
