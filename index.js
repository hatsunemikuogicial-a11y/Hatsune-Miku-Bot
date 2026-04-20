const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');
const chalk = require('chalk');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    
    const conn = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: 60000,
        syncFullHistory: false
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;
        
        if(qr) {
            console.log(chalk.yellow('📲 ESCANEA ESTE CODIGO QR:'));
            qrcode.generate(qr, { small: true });
        }

        if(connection === 'open') {
            console.log(chalk.green('✅ HATSUNE MIKU BOT CONECTADO EXITOSAMENTE'));
        }

        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('❌ Conexión cerrada, reconectando...'));
            if(shouldReconnect) startBot();
        }
    });

    // COMANDOS DEL BOT
    conn.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if(!msg.key.fromMe && msg.message) {
            const remitente = msg.key.remoteJid;
            const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

            if(texto.toLowerCase() === '.menu') {
                await conn.sendMessage(remitente, { 
                    text: `╭━━━━━━━━━━━━━━━━╮
┃ ✨ 𝑯𝒂𝒕𝒔𝒖𝒏𝒆 𝑴𝒊𝒌𝒖 𝑩𝒐𝒕 ✨
┃ Hecho con amor por Yoel 💖
┣━━━━━━━━━━━━━━━━┫
┃ 📋 *COMANDOS DISPONIBLES*
┃ .menu - Ver este menú
┃ .info - Información del bot
┃ .canal - Ir al canal
╰━━━━━━━━━━━━━━━━╯`
                });
            }

            if(texto.toLowerCase() === '.info') {
                await conn.sendMessage(remitente, { 
                    text: `🤖 *HATSUNE MIKU BOT*
Versión: 1.0.0
Creador: Yoel
Estado: Activo 24/7`
                });
            }
        }
    });
}

startBot();
