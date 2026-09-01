'use strict';

const { DatabaseSync } = require('node:sqlite');

/**
 * Crea (o abre) la base de datos SQLite y garantiza que la tabla exista.
 * Por defecto usa ':memory:' (los datos se pierden al reiniciar), igual
 * que el H2 en memoria que se mostró en clase. Para persistir los datos
 * en disco, se puede definir la variable de entorno DB_PATH, por ejemplo
 * DB_PATH=/app/data/todo.db
 *
 * @param {string} [path] Ruta del archivo de base de datos o ':memory:'.
 * @returns {import('node:sqlite').DatabaseSync}
 */
function createDatabase(path) {
  const dbPath = path || process.env.DB_PATH || ':memory:';
  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  return db;
}

module.exports = { createDatabase };
