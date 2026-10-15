const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbName = process.env.DB_NAME;
if (!dbName) {
  console.warn('[Config] ATTENTION : DB_NAME non défini. Valeur requise pour la connexion MySQL.');
}

module.exports = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'md_app',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: dbName || null,
  JWT_SECRET: process.env.JWT_SECRET || 'tui_masterdata_prod_jwt_secret_key_2026_finance',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'tui_masterdata_prod_jwt_refresh_secret_2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  AI_ENGINE_URL: process.env.AI_ENGINE_URL || 'http://localhost:8000',
  UPLOAD_DIR: path.join(__dirname, '../../uploads'),
  EXPORTS_DIR: path.join(__dirname, '../../exports'),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  BOOTSTRAP_ADMIN_EMAIL: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@tui.com',
  BOOTSTRAP_ADMIN_PASSWORD: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'InitialAdmin2026!',
  SAP_EXPORTER_TYPE: process.env.SAP_EXPORTER_TYPE || 'file',
  SAP_API_URL: process.env.SAP_API_URL || 'http://localhost:5001/sap/inbound',
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '1025', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'no-reply-masterdata@tui.com'
};
