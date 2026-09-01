'use strict';

const { Router } = require('express');

/**
 * @openapi
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Estudiar DevSecOps
 *         description:
 *           type: string
 *           example: Repasar Trivy y Sonar
 *         completed:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     TaskInput:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */
function createTaskRoutes(taskController) {
  const router = Router();

  /**
   * @openapi
   * /api/tasks:
   *   post:
   *     summary: Crear una tarea
   *     tags: [Tasks]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TaskInput'
   *     responses:
   *       201:
   *         description: Tarea creada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Task'
   *       400:
   *         description: Título inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/', taskController.create);

  /**
   * @openapi
   * /api/tasks:
   *   get:
   *     summary: Listar todas las tareas
   *     tags: [Tasks]
   *     responses:
   *       200:
   *         description: Lista de tareas
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Task'
   */
  router.get('/', taskController.list);

  /**
   * @openapi
   * /api/tasks/{id}:
   *   get:
   *     summary: Obtener una tarea por id
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Tarea encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Task'
   *       404:
   *         description: No existe la tarea
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/:id', taskController.getOne);

  /**
   * @openapi
   * /api/tasks/{id}:
   *   put:
   *     summary: Actualizar una tarea (título, descripción o estado)
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               completed:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Tarea actualizada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Task'
   *       400:
   *         description: Título inválido
   *       404:
   *         description: No existe la tarea
   */
  router.put('/:id', taskController.update);

  /**
   * @openapi
   * /api/tasks/{id}:
   *   delete:
   *     summary: Eliminar una tarea
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Tarea eliminada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Task'
   *       404:
   *         description: No existe la tarea
   */
  router.delete('/:id', taskController.remove);

  return router;
}

module.exports = { createTaskRoutes };
