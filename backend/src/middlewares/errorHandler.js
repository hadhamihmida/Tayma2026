function errorHandler(err, req, res, next) {
  console.error('[Unhandled Error]', err.stack || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Une erreur serveur inattendue est survenue'
  });
}

module.exports = errorHandler;
