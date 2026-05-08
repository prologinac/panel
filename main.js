const fs = require('fs');
const path = require('path');
const axios = require('axios'); 
const settings = require('./settings');

const commands = new Map();
const aliases = new Map();

// Global states
global.chatbot = { dm: true, gc: false };

const loadCommands = () => {
    const dir = path.join(__dirname, 'commands');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        try {
            const module = require(path.join(dir, file));
            if (module.name) {
                commands.set(module.name.toLowerCase(), module);
                if (module.alias) module.alias.forEach(a => aliases.set(a.toLowerCase(), module.name.toLowerCase()));
            }
        } catch (e) { console.error(`Error loading ${file}`); }
    }
};
loadCommands();

const handleMessages = async (sock, m) => {
    try {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.remoteJid === 'status@broadcast') return;
        
        const chatId = msg.key.remoteJid;
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        const prefix = settings.PREFIX || ".";
        const isCmd = body.startsWith(prefix);

        // --- COMMAND LOGIC ---
        if (isCmd) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const input = args.shift().toLowerCase();
            const cmdName = aliases.get(input) || input;
            const command = commands.get(cmdName);

            if (command) {
                await sock.sendPresenceUpdate('composing', chatId); 
                return await command.execute(sock, chatId, msg, args, { isOwner: msg.key.fromMe });
            }
        }

        // --- 🤖 CHATBOT LOGIC ---
        const isGroup = chatId.endsWith('@g.us');
        const aiEnabled = (isGroup ? global.chatbot.gc : global.chatbot.dm);

        if (aiEnabled && body && !msg.key.fromMe && !isCmd) {
            await sock.sendPresenceUpdate('composing', chatId); 
            
            try {
                const { data } = await axios.get(`https://apis.prexzyvilla.site/ai/ch?q=${encodeURIComponent(body)}`);
                const result = data.result || data.response;
                
                if (result) {
                    
                    setTimeout(async () => {
                        await sock.sendMessage(chatId, { text: result }, { quoted: msg });
                    }, 1500);
                }
            } catch (e) { console.log("AI Error"); }
        }
    } catch (err) { console.error(err); }
};

module.exports = { handleMessages };
