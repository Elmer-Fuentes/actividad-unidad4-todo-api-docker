'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'To-Do API',
      version: '1.0.0',
      description:
        'API REST de tareas (To-Do) - Actividad Unidad IV (Trivy, Sonar, Docker).',
    },
    servers: [{ url: '/', description: 'Servidor actual' }],
  },
  // Escanea las anotaciones @openapi dentro de las rutas
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
