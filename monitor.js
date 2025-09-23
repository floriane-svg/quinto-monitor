const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

// ⚡ Infos Telegram
const TELEGRAM_TOKEN = '8249846675:AAFc5uAjkhFWRzXTo73wvv8mmOYTRfh7CPE';
const CHAT_ID = '8291065466';

// 🔍 URL à surveiller
const URL = 'https://www.quintoandar.com.br/alugar/imovel/rio-de-janeiro-rj-brasil/de-500-a-3500-reais?geoJson=%7B%22type%22%3A%22Feature%22%2C%22geometry%22%3A%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B-43.23262414111432%2C-22.992444069489103%5D%2C%5B-43.23682984484967%2C-22.98509575474891%5D%2C%5B-43.230564204590884%2C-22.9799595984888%5D%2C%5B-43.2286759294444%2C-22.97719389501065%5D%2C%5B-43.22249611987409%2C-22.97648270496654%5D%2C%5B-43.199836818116275%2C-22.97948548191301%5D%2C%5B-43.19872101916608%2C-22.981856048154672%5D%2C%5B-43.1982918657237%2C-22.983910505251657%5D%2C%5B-43.18953713549909%2C-22.983515419774875%5D%2C%5B-43.189622966187564%2C-22.991100859024122%5D%2C%5B-43.23262414111432%2C-22.992444069489103%5D%5D%5D%7D%2C%22properties%22%3A%7B%7D%7D';
const TEXT_TO_CHECK = 'Não há imóveis no QuintoAndar para esta busca.';

let lastState = true;

async function sendTelegram(msg) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('📲 Telegram envoyé :', data.ok);
  } catch (err) {
    console.error('❌ Erreur Telegram :', err);
  }
}

async function checkPage() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

    const content = await page.content();
    const isEmpty = content.includes(TEXT_TO_CHECK);
    const timestamp = new Date().toLocaleTimeString();

    if (isEmpty && !lastState) {
      console.log(`[${timestamp}] 💤 Page vide à nouveau.`);
      lastState = true;
    } else if (!isEmpty && lastState) {
      console.log(`[${timestamp}] 🚨 Nouvelle annonce détectée !`);
      lastState = false;
      await sendTelegram('🚨 Nouvelle annonce sur QuintoAndar !');
    } else {
      console.log(`[${timestamp}] ⏳ Pas de changement.`);
    }

  } catch (err) {
    console.error('❌ Erreur checkPage :', err);
  } finally {
    if (browser) await browser.close();
  }
}

// 🔄 Vérifie toutes les 30 secondes
setInterval(checkPage, 30000);
console.log('💎 Monitoring QuintoAndar lancé toutes les 30 secondes...');

// 🌐 Serveur Express
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('💎 Monitoring QuintoAndar actif !'));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Serveur actif sur le port ${PORT}`));
