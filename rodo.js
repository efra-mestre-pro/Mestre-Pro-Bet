const admin = require('firebase-admin');
const axios = require('axios');

// 1. Pega a chave de serviço que você salvou nos Secrets do GitHub
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// 2. Inicializa o Firebase apontando para o Realtime Database (O banco que o seu Blogger lê)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bet-pro-41f35-default-rtdb.firebaseio.com/"
  });
}

const db = admin.database();

async function buscarEEnviar() {
  try {
    console.log('🛰️ Conectando à API de esportes...');
    
    // SUBSTITUA ABAIXO PELA SUA URL DE API E TOKEN REAL
    const response = await axios.get('SUA_URL_DA_API_AQUI', {
      headers: { 'X-Auth-Token': 'SEU_TOKEN_AQUI' } 
    });

    const jogosApi = response.data.matches || response.data; // Ajuste conforme o formato da sua API
    const listaParaFirebase = {};

    console.log(`⚽ Processando ${jogosApi.length} jogos...`);

    // 3. Mapeia os dados da API para os nomes que seu site no Blogger entende
    jogosApi.forEach((jogo, index) => {
      // Ajuste os nomes (ex: jogo.homeTeam.name) conforme a sua API envia
      listaParaFirebase[`jogo_${index}`] = {
        equipeA: jogo.homeTeam?.name || jogo.team_home || 'Time A',
        equipeB: jogo.awayTeam?.name || jogo.team_away || 'Time B',
        liga: jogo.competition?.name || jogo.league || 'Liga Pro',
        odds: jogo.odds?.msg || '1.80',
        placar: jogo.score?.fullTime?.home !== undefined ? `${jogo.score.fullTime.home} x ${jogo.score.fullTime.away}` : 'vs',
        hora: jogo.utcDate ? new Date(jogo.utcDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--'
      };
    });

    // 4. Limpa o banco e insere os novos dados no nó 'jogos'
    await db.ref('jogos').set(listaParaFirebase);

    console.log('✅ Bet Pro sincronizado com sucesso no Realtime Database!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na operação:', error.message);
    process.exit(1);
  }
}

buscarEEnviar();
