'use strict';

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
}

module.exports = { errorHandler };
