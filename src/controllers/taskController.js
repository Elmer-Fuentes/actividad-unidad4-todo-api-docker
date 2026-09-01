'use strict';

function isValidTitle(title) {
  return typeof title === 'string' && title.trim().length > 0;
}

/**
 * Crea el controlador de tareas. Recibe el modelo por parámetro (inyección
 * de dependencias) para poder probarlo con una base de datos en memoria
 * sin necesidad de levantar el servidor HTTP completo.
 *
 * @param {ReturnType<import('../models/taskModel').createTaskModel>} taskModel
 */
function createTaskController(taskModel) {
  return {
    create(req, res) {
      const { title, description } = req.body || {};

      if (!isValidTitle(title)) {
        return res
          .status(400)
          .json({ error: 'El campo "title" es obligatorio y no puede estar vacío.' });
      }

      const task = taskModel.create(title.trim(), description);
      return res.status(201).json(task);
    },

    list(req, res) {
      return res.status(200).json(taskModel.findAll());
    },

    getOne(req, res) {
      const id = Number(req.params.id);
      const task = taskModel.findById(id);

      if (!task) {
        return res.status(404).json({ error: `No existe una tarea con id ${id}.` });
      }
      return res.status(200).json(task);
    },

    update(req, res) {
      const id = Number(req.params.id);
      const { title, description, completed } = req.body || {};

      if (title !== undefined && !isValidTitle(title)) {
        return res.status(400).json({ error: 'El campo "title" no puede estar vacío.' });
      }

      const updated = taskModel.update(id, {
        title: title !== undefined ? title.trim() : undefined,
        description,
        completed,
      });

      if (!updated) {
        return res.status(404).json({ error: `No existe una tarea con id ${id}.` });
      }
      return res.status(200).json(updated);
    },

    remove(req, res) {
      const id = Number(req.params.id);
      const deleted = taskModel.remove(id);

      if (!deleted) {
        return res.status(404).json({ error: `No existe una tarea con id ${id}.` });
      }
      return res.status(200).json(deleted);
    },
  };
}

module.exports = { createTaskController, isValidTitle };
