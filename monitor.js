const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const chalk = require('chalk');
const express = require('express');
const app = express();

const TELEGRAM_TOKEN = '8249846675:AAFc5uAjkhFWRzXTo73wvv8mmOYTRfh7CPE';
const CHAT_ID = '8291065466';

const URL = 'https://www.quintoandar.com.br/alugar/imovel/rio-de-janeiro-rj-brasil/de-500-a-3500-reais?...';
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
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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

// Monitoring toutes les 30 secondes
console.log(chalk.cyan('💎 Monitoring QuintoAndar démarré toutes les 30 secondes...'));
setInterval(checkPage, 30000);

// Serveur Express obligatoire pour EvenNode
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('💎 Monitoring QuintoAndar actif !'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));