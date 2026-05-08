const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");


const settings = require('./settings');
const { handleMessages } = require('./main'); 
async function startMadrinBot() {
   const sessionDir = path.join(__dirname, 'session');
   if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
       version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Set to true if you want to scan QR instead of pairing
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- PAIRING CODE LOGIC ---
    if (!sock.authState.creds.registered) {
        const phoneNumber = settings.OWNER_NUMBER.replace(/[^0-9]/g, '');
        setTimeout(async () => {
            try {
               let code = await sock.requestPairingCode(phoneNumber);
               code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n✅ YOUR PAIRING CODE: ${code}\n`);
            } catch (error) {
                console.error("❌ Pairing Error:", error.message);
            }
        }, 5000);
    }

    // --- THE MESSAGE LISTENER  ---
    sock.ev.on('messages.upsert', async (m) => {
        try {
            
           await handleMessages(sock, m); 
        } catch (err) {
            console.error("Handler Error:", err);
        }
    });
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
           console.log(`🎉 MADRIN-MD IS LIVE!`);
            await sock.sendMessage(sock.user.id, { text: settings.WELCOME_MESSAGE });
        }
        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
           if (reason !== DisconnectReason.loggedOut) {
                startMadrinBot();
            }
        }
    });
    sock.ev.on("creds.update", saveCreds);
}

startMadrinBot();

