const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.AI_ENGINE_URL,
  timeout: 10000
});

const aiService = {
  // Screen complete request (OCR + Fraud + Dedup + Risk + Segmentation)
  async screenRequest(payload) {
    try {
      const response = await client.post('/api/v1/pipeline/screen-request', payload);
      return {
        available: true,
        ...response.data
      };
    } catch (err) {
      console.warn('[AI Service] FastAPI indisponible :', err.message);
      return {
        available: false,
        status: 'AI_UNAVAILABLE',
        error: `Moteur IA non joignable (${err.message}). Traitement manuel requis.`
      };
    }
  },

  // Axe 1: OCR / NLP
  async extractOcr(payload) {
    try {
      const response = await client.post('/api/v1/ocr/extract', payload);
      return response.data;
    } catch (err) {
      console.warn('[AI Service] Erreur extraction OCR FastAPI :', err.message);
      throw new Error(`Service OCR indisponible: ${err.message}`);
    }
  },

  // Axe 2: Fraud Detection (Isolation Forest)
  async checkFraud(payload) {
    try {
      const response = await client.post('/api/v1/fraud/check', payload);
      return response.data;
    } catch (err) {
      console.warn('[AI Service] Erreur détection fraude FastAPI :', err.message);
      throw new Error(`Service anti-fraude indisponible: ${err.message}`);
    }
  },

  // Axe 3: Semantic Deduplication (Sentence-BERT / RapidFuzz)
  async deduplicate(payload) {
    try {
      const response = await client.post('/api/v1/matching/deduplicate', payload);
      return response.data;
    } catch (err) {
      console.warn('[AI Service] Erreur déduplication FastAPI :', err.message);
      throw new Error(`Service de déduplication indisponible: ${err.message}`);
    }
  },

  // Axe 4: Risk Scoring (XGBoost)
  async scoreRisk(payload) {
    try {
      const response = await client.post('/api/v1/risk/score', payload);
      return response.data;
    } catch (err) {
      console.warn('[AI Service] Erreur scoring risque FastAPI :', err.message);
      throw new Error(`Service de scoring indisponible: ${err.message}`);
    }
  },

  // Axe 5: Segmentation (K-Means)
  async classifySegmentation(payload) {
    try {
      const response = await client.post('/api/v1/segmentation/classify', payload);
      return response.data;
    } catch (err) {
      console.warn('[AI Service] Erreur segmentation FastAPI :', err.message);
      throw new Error(`Service de segmentation indisponible: ${err.message}`);
    }
  },

  // Axe 6: Time-Series Forecasting (Endpoint POST /forecast)
  async getForecast(payload = {}) {
    try {
      const response = await client.post('/api/v1/forecast', payload);
      return response.data;
    } catch (err) {
      console.warn('[AI Service] Erreur prévisions temporelles FastAPI :', err.message);
      throw new Error(`Service de prévision indisponible: ${err.message}`);
    }
  },

  // Axe 7: RAG Query (FAISS)
  async queryRag(payload) {
    try {
      const response = await client.post('/api/v1/rag/query', payload);
      return response.data;
    } catch (err) {
      console.warn('[AI Service] Erreur assistant RAG FastAPI :', err.message);
      throw new Error(`Assistant RAG indisponible: ${err.message}`);
    }
  },

  // Model Metrics
  async getMetrics() {
    try {
      const response = await client.get('/api/v1/metrics');
      return response.data;
    } catch (err) {
      return {
        available: false,
        status: 'OFFLINE',
        message: 'Moteur IA hors ligne ou en cours d initialisation'
      };
    }
  }
};

module.exports = aiService;
