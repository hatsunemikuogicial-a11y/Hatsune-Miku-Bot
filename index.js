const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys")
const pino = require("pino")
const cfonts = require("cfonts")

// CONFIG
const OWNER = "5491124815894"
const PREFIX = "."

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

  // 🔑 VINCULACIÓN AUTOMÁTICA
  if (!state.creds.registered) {
    const code = await sock.requestPairingCode(OWNER)
    console.log("🔑 Código de vinculación:", code)
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "open") {
      console.log("✅ BOT CONECTADO")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...")
        start
