'use strict';

const request = require('supertest');
const createApp = require('./app');
const TaskStore = require('./taskStore');

describe('todo-api', () => {
  let app;

  beforeEach(() => {
    app = createApp(new TaskStore());
  });

  test('GET /health responde ok y version', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(res.body.version).toBeDefined();
  });

  test('GET / sirve React si existe el build', async () => {
    const fs = require('fs');
    const path = require('path');
    const indexFile = path.join(__dirname, '..', 'public', 'index.html');
    const res = await request(app).get('/');

    if (!fs.existsSync(indexFile)) {
      expect(res.status).toBe(404);
      return;
    }

    expect(res.status).toBe(200);
    expect(res.text).toContain('root');
  });

  test('GET /tasks inicia vacío', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /tasks crea una tarea con estado PENDIENTE', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Comprar leche', description: '2 litros' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Comprar leche',
      description: '2 litros',
      status: 'PENDIENTE',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  test('POST /tasks sin title responde 400', async () => {
    const res = await request(app).post('/tasks').send({});
    expect(res.status).toBe(400);
  });

  test('POST /tasks con estado inválido responde 400', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'X', status: 'OTRO' });
    expect(res.status).toBe(400);
  });

  test('PUT /tasks/:id actualiza título, descripción y estado', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Tarea 1' });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: 'Tarea editada', description: 'Detalle', status: 'EN PROGRESO' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      title: 'Tarea editada',
      description: 'Detalle',
      status: 'EN PROGRESO',
    });
  });

  test('PUT /tasks/:id inexistente responde 404', async () => {
    const res = await request(app).put('/tasks/999').send({ status: 'COMPLETADA' });
    expect(res.status).toBe(404);
  });

  test('DELETE /tasks/:id elimina una tarea', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Tarea a borrar' });
    const res = await request(app).delete(`/tasks/${created.body.id}`);
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/tasks/${created.body.id}`);
    expect(getRes.status).toBe(404);
  });

  test('DELETE /tasks/:id inexistente responde 404', async () => {
    const res = await request(app).delete('/tasks/999');
    expect(res.status).toBe(404);
  });

  test('GET /tasks filtra por estado', async () => {
    await request(app).post('/tasks').send({ title: 'A', status: 'PENDIENTE' });
    await request(app).post('/tasks').send({ title: 'B', status: 'COMPLETADA' });

    const res = await request(app).get('/tasks').query({ status: 'COMPLETADA' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('B');
  });

  test('GET /tasks/stats resume los estados', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    await request(app).post('/tasks').send({ title: 'B', status: 'EN PROGRESO' });
    const res = await request(app).get('/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      PENDIENTE: 1,
      'EN PROGRESO': 1,
      COMPLETADA: 0,
      total: 2,
    });
  });
});
