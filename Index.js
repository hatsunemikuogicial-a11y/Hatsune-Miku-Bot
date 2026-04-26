const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys")
const pino = require("pino")
const cfonts = require("cfonts")

// BANNER
cfonts.say('HATSUNE\nMIKU', {
  font: 'block',
  align: 'center',
  colors: ['cyan', 'magenta']
})

console.log("🤖 Hatsune-Miku-Bot MD iniciado")

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    version
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "open") {
      console.log("✅ BOT CONECTADO 24/7")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...")
        startBot()
      } else {
        console.log("❌ Sesión cerrada, elimina auth y vuelve a vincular")
      }
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith("@g.us")
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""

    // ===== MENÚ =====
    if (text === ".menu") {
      await sock.sendMessage(from, {
        image: { url: "https://i.imgur.com/8QZ7ZQK.jpeg" },
        caption: `✨ *Hatsune-Miku-Bot MD*

📌 .menu
👤 .info
🏓 .ping
😂 .joke
🎮 .game

🔧 ADMIN:
.tag
.abrir
.cerrar`
      })
    }

    // ===== INFO =====
    if (text === ".info") {
      await sock.sendMessage(from, {
        text: "🤖 Bot activo y funcionando 24/7"
      })
    }

    // ===== PING =====
    if (text === ".ping") {
      await sock.sendMessage(from, { text: "🏓 Pong!" })
    }

    // ===== JUEGO SIMPLE =====
    if (text === ".game") {
      const num = Math.floor(Math.random() * 10)
      await sock.sendMessage(from, {
        text: `🎮 Adivina el número (0-9)\nRespuesta: ${num}`
      })
    }

    // ===== TAG TODOS =====
    if (text === ".tag" && isGroup) {
      const group = await sock.groupMetadata(from)
      const members = group.participants.map(p => p.id)

      await sock.sendMessage(from, {
        text: "📢 Atención a todos",
        mentions: members
      })
    }

    // ===== ABRIR GRUPO =====
    if (text === ".abrir" && isGroup) {
      await sock.groupSettingUpdate(from, "not_announcement")
    }

    // ===== CERRAR GRUPO =====
    if (text === ".cerrar" && isGroup) {
      await sock.groupSettingUpdate(from, "announcement")
    }
  })
}

startBot()
