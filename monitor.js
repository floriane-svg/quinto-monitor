const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const urls = [
  'https://www.quintoandar.com.br/alugar/imovel/ilha-dos-caicaras-lagoa-rio-de-janeiro-rj-brasil/de-500-a-3500-reais',
  'https://www.quintoandar.com.br/alugar/imovel/leblon-rio-de-janeiro-rj-brasil/de-500-a-3500-reais'
];

(async () => {
  try {
    for (const url of urls) {
      console.log(`🔍 Vérification : ${url}`);

      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const html = response.data.toLowerCase();
      const hasApartmentCard = html.includes('cozy__cardrow-container');

      if (hasApartmentCard) {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          chat_id: TELEGRAM_CHAT_ID,
          text: `🎉 Un bien est dispo sur QuintoAndar 👉 ${url}`
        });
        console.log(`✅ Bien détecté sur ${url}`);
      } else {
        console.log(`❌ Aucun bien sur ${url}`);
      }
    }
  } catch (error) {
    console.error('🚨 Erreur lors de la vérification :', error.message);
  }
})();
