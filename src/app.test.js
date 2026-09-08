'use strict';

const request = require('supertest');
const createApp = require('./app');
const TaskStore = require('./taskStore');

describe('todo-api', () => {
  let app;

  beforeEach(() => {
    app = createApp(new TaskStore());
  });

  test('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /tasks inicia vacío', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /tasks crea una tarea', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Comprar leche' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Comprar leche', completed: false });
  });

  test('POST /tasks sin title responde 400', async () => {
    const res = await request(app).post('/tasks').send({});
    expect(res.status).toBe(400);
  });

  test('PUT /tasks/:id actualiza una tarea', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Tarea 1' });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  test('PUT /tasks/:id inexistente responde 404', async () => {
    const res = await request(app).put('/tasks/999').send({ completed: true });
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
});
