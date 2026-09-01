'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createDatabase } = require('../src/config/database');
const { createTaskModel } = require('../src/models/taskModel');

function setup() {
  const db = createDatabase(':memory:');
  return createTaskModel(db);
}

test('create() guarda una tarea nueva con completed=false', () => {
  const model = setup();
  const task = model.create('Estudiar DevSecOps', 'Repasar Trivy y Sonar');

  assert.equal(task.title, 'Estudiar DevSecOps');
  assert.equal(task.description, 'Repasar Trivy y Sonar');
  assert.equal(task.completed, false);
  assert.ok(task.id);
  assert.ok(task.createdAt);
});

test('create() acepta descripción vacía', () => {
  const model = setup();
  const task = model.create('Solo título');
  assert.equal(task.description, '');
});

test('findAll() devuelve todas las tareas creadas, en orden', () => {
  const model = setup();
  model.create('Tarea 1');
  model.create('Tarea 2');

  const tasks = model.findAll();
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].title, 'Tarea 1');
  assert.equal(tasks[1].title, 'Tarea 2');
});

test('findById() devuelve la tarea correcta', () => {
  const model = setup();
  const created = model.create('Buscarme');
  const found = model.findById(created.id);
  assert.equal(found.title, 'Buscarme');
});

test('findById() devuelve null si no existe', () => {
  const model = setup();
  assert.equal(model.findById(999), null);
});

test('update() modifica título, descripción y estado', () => {
  const model = setup();
  const task = model.create('Original');

  const updated = model.update(task.id, {
    title: 'Modificada',
    description: 'Nueva desc',
    completed: true,
  });

  assert.equal(updated.title, 'Modificada');
  assert.equal(updated.description, 'Nueva desc');
  assert.equal(updated.completed, true);
  assert.ok(updated.updatedAt);
});

test('update() con cambios parciales no borra los demás campos', () => {
  const model = setup();
  const task = model.create('Original', 'Descripción original');

  const updated = model.update(task.id, { completed: true });

  assert.equal(updated.title, 'Original');
  assert.equal(updated.description, 'Descripción original');
  assert.equal(updated.completed, true);
});

test('update() devuelve null si la tarea no existe', () => {
  const model = setup();
  assert.equal(model.update(999, { completed: true }), null);
});

test('remove() elimina la tarea y la devuelve', () => {
  const model = setup();
  const task = model.create('Tarea a eliminar');

  const removed = model.remove(task.id);
  assert.equal(removed.id, task.id);
  assert.equal(model.findById(task.id), null);
});

test('remove() devuelve null si la tarea no existe', () => {
  const model = setup();
  assert.equal(model.remove(999), null);
});
