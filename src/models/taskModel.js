'use strict';

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  };
}

/**
 * Crea el modelo de tareas a partir de una conexión de base de datos ya
 * inicializada. Separar esta capa permite probarla de forma aislada
 * (sin necesidad de levantar el servidor Express) y reutilizarla desde
 * distintos controladores si el proyecto crece.
 *
 * @param {import('node:sqlite').DatabaseSync} db
 */
function createTaskModel(db) {
  const insertStmt = db.prepare(
    'INSERT INTO tasks (title, description, completed, created_at) VALUES (?, ?, 0, ?)',
  );
  const selectAllStmt = db.prepare('SELECT * FROM tasks ORDER BY id ASC');
  const selectByIdStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const deleteStmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const updateStmt = db.prepare(
    'UPDATE tasks SET title = ?, description = ?, completed = ?, updated_at = ? WHERE id = ?',
  );

  return {
    create(title, description) {
      const now = new Date().toISOString();
      const result = insertStmt.run(title, description || '', now);
      return mapRow(selectByIdStmt.get(result.lastInsertRowid));
    },

    findAll() {
      return selectAllStmt.all().map(mapRow);
    },

    findById(id) {
      return mapRow(selectByIdStmt.get(id));
    },

    update(id, changes) {
      const existing = selectByIdStmt.get(id);
      if (!existing) return null;

      const title = changes.title !== undefined ? changes.title : existing.title;
      const description =
        changes.description !== undefined ? changes.description : existing.description;
      const completed =
        changes.completed !== undefined ? (changes.completed ? 1 : 0) : existing.completed;
      const now = new Date().toISOString();

      updateStmt.run(title, description, completed, now, id);
      return mapRow(selectByIdStmt.get(id));
    },

    remove(id) {
      const existing = mapRow(selectByIdStmt.get(id));
      if (!existing) return null;
      deleteStmt.run(id);
      return existing;
    },
  };
}

module.exports = { createTaskModel };
