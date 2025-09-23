const puppeteer = require('puppeteer-core'); // version légère
const fetch = require('node-fetch');
const chalk = require('chalk');
const express = require('express');
const app = express();

// ⚡ Token et chat ID Telegram
const TELEGRAM_TOKEN = '8249846675:AAFc5uAjkhFWRzXTo73wvv8mmOYTRfh7CPE';
const CHAT_ID = '8291065466';

// URL et texte à surveiller
const URL = 'https://www.quintoandar.com.br/alugar/imovel/rio-de-janeiro-rj-brasil/de-500-a-3500-reais?geoJson=%7B%22type%22%3A%22Feature%22%2C%22geometry%22%3A%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B-43.23600955289077%2C-22.979703796453084%5D%2C%5B-43.23326297085952%2C-22.995190718919638%5D%2C%5B-43.182966187412255%2C-22.986341266381395%5D%2C%5B-43.18639941495132%2C-22.981600249709548%5D%2C%5B-43.19652743619155%2C-22.984128812641217%5D%2C%5B-43.20408053677749%2C-22.977175150704092%5D%2C%5B-43.22261996548843%2C-22.97591081008484%5D%2C%5B-43.23600955289077%2C-22.979703796453084%5D%5D%5D%7D%2C%22properties%22%3A%7B%7D%7D';
const SELECTOR = '#__next > div.cozy__theme--default.cozy__theme--default-next > div > main > section.SideMenuHouseList_customSection__XJ5QW > div > div.EmptySearchState_wrapper__TKEeL > div > h3';
const TEXT_TO_CHECK = 'Não há imóveis no QuintoAndar para esta busca.';

let lastState = true;

async function sendTelegram(msg) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(chalk.green(`Notif Telegram envoyée: ${data.ok}`));
  } catch (err) {
    console.error(chalk.red('Erreur Telegram:'), err);
  }
}

async function checkPage() {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser', // chemin EvenNode
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

    const element = await page.$(SELECTOR);
    const text = element ? await page.evaluate(el => el.textContent, element) : '';
    const isEmpty = text.trim() === TEXT_TO_CHECK;

    const timestamp = new Date().toLocaleTimeString();

    if (isEmpty && !lastState) {
      console.log(chalk.blue(`[${timestamp}] Page vide à nouveau.`));
      lastState = true;
    } else if (!isEmpty && lastState) {
      console.log(chalk.yellow(`[${timestamp}] Nouvelle annonce détectée ! ✨`));
      lastState = false;
      await sendTelegram('🚨 Nouvelle annonce sur QuintoAndar !');
    } else {
      console.log(chalk.gray(`[${timestamp}] Pas de changement.`));
    }

  } catch (err) {
    console.error(chalk.red('Erreur checkPage:'), err);
  } finally {
    if (browser) await browser.close();
  }
}

// Démarrage du monitoring toutes les 30s
setInterval(checkPage, 30000);
console.log(chalk.cyan('💎 Monitoring QuintoAndar démarré...'));

// Serveur Express minimal pour EvenNode
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('💎 Monitoring QuintoAndar actif !'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));