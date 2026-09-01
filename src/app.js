'use strict';

const express = require('express');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./docs/swagger');
const { createDatabase } = require('./config/database');
const { createTaskModel } = require('./models/taskModel');
const { createTaskController } = require('./controllers/taskController');
const { createTaskRoutes } = require('./routes/taskRoutes');
const { errorHandler } = require('./middleware/errorHandler');

/**
 * Crea la aplicación Express completa. Recibir la ruta de la base de datos
 * como parámetro (en lugar de crearla como variable global) permite que
 * las pruebas de integración levanten una instancia aislada con su propia
 * base de datos en memoria.
 *
 * @param {string} [dbPath]
 */
function createApp(dbPath) {
  const app = express();
  app.use(express.json());

  const db = createDatabase(dbPath);
  const taskModel = createTaskModel(db);
  const taskController = createTaskController(taskModel);

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/tasks', createTaskRoutes(taskController));

  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
