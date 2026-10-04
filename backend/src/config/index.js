const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'masterdata_ia',
  JWT_SECRET: process.env.JWT_SECRET || 'master_data_ia_jwt_secret_key_2026_finance_tui_group',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'master_data_ia_jwt_refresh_secret_key_2026_finance_tui_group',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  AI_ENGINE_URL: process.env.AI_ENGINE_URL || 'http://localhost:8000',
  DATABASE_URL: process.env.DATABASE_URL || null,
  UPLOAD_DIR: path.join(__dirname, '../../uploads'),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SAP_SIMULATOR_ENABLED: true
};

