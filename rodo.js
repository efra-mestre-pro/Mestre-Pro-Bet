const admin = require("firebase-admin");
const fetch = require("node-fetch");

const TIMEZONE = "Africa/Maputo";

function getMaputoDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE })).toISOString().split("T")[0];
}

function initFirebase() {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG.trim());
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
  } catch (err) {
    console.error("Erro Firebase:", err.message);
    process.exit(1);
  }
}

initFirebase();
const db = admin.firestore();
const API_KEY = process.env.API_FOOTBALL_KEY;

async function executar() {
  const hoje = getMaputoDate();
  const url = `https://v3.football.api-sports.io/fixtures?date=${hoje}`;

  try {
    const res = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
    const json = await res.json();
    const jogos = json.response || [];

    const dadosProcessados = jogos.map(j => ({
      liga: { nome: j.league.name, logo: j.league.logo },
      casa: { nome: j.teams.home.name, logo: j.teams.home.logo },
      fora: { nome: j.teams.away.name, logo: j.teams.away.logo },
      status: j.fixture.status.short,
      resultado: j.score.fulltime
    }));

    await db.collection("central_esportes").doc("dashboard_hoje").set({
      jogos: dadosProcessados,
      atualizadoEm: new Date().toISOString()
    });

    console.log("✅ Dados atualizados com logos!");
  } catch (err) {
    console.error("Erro:", err.message);
  }
}

executar();
