'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createDatabase } = require('../src/config/database');
const { createTaskModel } = require('../src/models/taskModel');
const { createTaskController } = require('../src/controllers/taskController');

// Objeto "res" mínimo que imita la API de Express (status/json encadenables),
// para probar el controlador sin levantar un servidor HTTP real.
function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
}

function setup() {
  const db = createDatabase(':memory:');
  const model = createTaskModel(db);
  return createTaskController(model);
}

test('create() responde 400 si falta el título', () => {
  const controller = setup();
  const res = mockRes();

  controller.create({ body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.ok(res.body.error);
});

test('create() responde 400 si el título es solo espacios', () => {
  const controller = setup();
  const res = mockRes();

  controller.create({ body: { title: '   ' } }, res);

  assert.equal(res.statusCode, 400);
});

test('create() responde 201 con la tarea creada', () => {
  const controller = setup();
  const res = mockRes();

  controller.create({ body: { title: 'Nueva tarea' } }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.title, 'Nueva tarea');
  assert.equal(res.body.completed, false);
});

test('list() responde 200 con un arreglo de tareas', () => {
  const controller = setup();
  const res = mockRes();

  controller.create({ body: { title: 'A' } }, mockRes());
  controller.list({}, res);

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.body.length, 1);
});

test('getOne() responde 200 si la tarea existe', () => {
  const controller = setup();
  const createRes = mockRes();
  controller.create({ body: { title: 'Buscar' } }, createRes);

  const res = mockRes();
  controller.getOne({ params: { id: String(createRes.body.id) } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.title, 'Buscar');
});

test('getOne() responde 404 si no existe', () => {
  const controller = setup();
  const res = mockRes();

  controller.getOne({ params: { id: '999' } }, res);

  assert.equal(res.statusCode, 404);
});

test('update() responde 400 si el título viene vacío', () => {
  const controller = setup();
  const createRes = mockRes();
  controller.create({ body: { title: 'X' } }, createRes);

  const res = mockRes();
  controller.update(
    { params: { id: String(createRes.body.id) }, body: { title: '   ' } },
    res,
  );

  assert.equal(res.statusCode, 400);
});

test('update() responde 200 y marca completed=true', () => {
  const controller = setup();
  const createRes = mockRes();
  controller.create({ body: { title: 'Marcar' } }, createRes);

  const res = mockRes();
  controller.update(
    { params: { id: String(createRes.body.id) }, body: { completed: true } },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.completed, true);
});

test('update() responde 404 si la tarea no existe', () => {
  const controller = setup();
  const res = mockRes();

  controller.update({ params: { id: '999' }, body: { completed: true } }, res);

  assert.equal(res.statusCode, 404);
});

test('remove() responde 200 y borra la tarea', () => {
  const controller = setup();
  const createRes = mockRes();
  controller.create({ body: { title: 'Borrar' } }, createRes);

  const res = mockRes();
  controller.remove({ params: { id: String(createRes.body.id) } }, res);

  assert.equal(res.statusCode, 200);
});

test('remove() responde 404 si la tarea no existe', () => {
  const controller = setup();
  const res = mockRes();

  controller.remove({ params: { id: '999' } }, res);

  assert.equal(res.statusCode, 404);
});
