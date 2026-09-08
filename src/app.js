'use strict';

const express = require('express');
const TaskStore = require('./taskStore');

/**
 * Crea la aplicación Express. Se exporta como función (en lugar de una instancia
 * ya creada) para poder inyectar un TaskStore distinto en las pruebas.
 */
function createApp(store = new TaskStore()) {
  const app = express();
  app.use(express.json());

  // Endpoint de salud, útil para verificar que el contenedor arrancó bien.
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Listar todas las tareas.
  app.get('/tasks', (req, res) => {
    res.status(200).json(store.getAll());
  });

  // Obtener una tarea por id.
  app.get('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const task = store.getById(id);

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    return res.status(200).json(task);
  });

  // Crear una tarea nueva.
  app.post('/tasks', (req, res) => {
    const { title, description } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "title" es obligatorio' });
    }

    const task = store.create({ title: title.trim(), description });
    return res.status(201).json(task);
  });

  // Actualizar una tarea existente (título, descripción y/o estado completado).
  app.put('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const { title, description, completed } = req.body || {};

    const changes = {};
    if (title !== undefined) changes.title = title;
    if (description !== undefined) changes.description = description;
    if (completed !== undefined) changes.completed = Boolean(completed);

    const updated = store.update(id, changes);

    if (!updated) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    return res.status(200).json(updated);
  });

  // Eliminar una tarea.
  app.delete('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const deleted = store.remove(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    return res.status(204).send();
  });

  // Manejador de rutas no encontradas.
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  return app;
}

module.exports = createApp;
