const axios = require('axios');
const cheerio = require('cheerio');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

(async () => {
  try {
    const response = await axios.get('https://www.quintoandar.com.br/alugar/imovel/rio-de-janeiro-rj-brasil/de-500-a-3500-reais?geoJson=%7B%22type%22%3A%22Feature%22%2C%22geometry%22%3A%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B-43.23600955289077%2C-22.979703796453084%5D%2C%5B-43.23326297085952%2C-22.995190718919638%5D%2C%5B-43.182966187412255%2C-22.986341266381395%5D%2C%5B-43.18639941495132%2C-22.981600249709548%5D%2C%5B-43.19652743619155%2C-22.984128812641217%5D%2C%5B-43.20408053677749%2C-22.977175150704092%5D%2C%5B-43.22261996548843%2C-22.97591081008484%5D%2C%5B-43.23600955289077%2C-22.979703796453084%5D%5D%5D%7D%2C%22properties%22%3A%7B%7D%7D', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const $ = cheerio.load(response.data);
    const noResultsText = $('h3.CozyTypography.xih2fc.DKgo6-').text().trim();

    if (noResultsText === 'Não há imóveis no QuintoAndar para esta busca.') {
      console.log('❌ Toujours aucun bien disponible');
    } else {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: '🏠 Un bien est disponible sur QuintoAndar ! Va vite voir 👀'
      });
      console.log('✅ Bien détecté, Telegram envoyé');
    }
  } catch (error) {
    console.error('🚨 Erreur lors de la vérification :', error.message);
  }
})();
