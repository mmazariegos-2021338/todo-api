'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const TaskStore = require('./taskStore');
const { normalizeStatus } = TaskStore;

function createApp(store = new TaskStore()) {
  const app = express();
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.json());
  app.use(express.static(publicDir));

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      version: process.env.APP_VERSION || '1.0',
    });
  });

  app.get('/tasks/stats', (req, res) => {
    res.status(200).json(store.stats());
  });

  app.get('/tasks', (req, res) => {
    const statusFilter = req.query.status
      ? normalizeStatus(String(req.query.status))
      : undefined;

    if (req.query.status && statusFilter === null) {
      return res.status(400).json({ error: 'Estado inválido. Use PENDIENTE, EN PROGRESO o COMPLETADA' });
    }

    return res.status(200).json(store.getAll(statusFilter));
  });

  app.get('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const task = store.getById(id);

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    return res.status(200).json(task);
  });

  app.post('/tasks', (req, res) => {
    const { title, description, status } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "title" es obligatorio' });
    }

    const normalized = normalizeStatus(status);
    if (status !== undefined && status !== '' && normalized === null) {
      return res.status(400).json({ error: 'Estado inválido. Use PENDIENTE, EN PROGRESO o COMPLETADA' });
    }

    const task = store.create({
      title: title.trim(),
      description,
      status: normalized,
    });
    return res.status(201).json(task);
  });

  app.put('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const { title, description, status } = req.body || {};

    const changes = {};
    if (title !== undefined) changes.title = title;
    if (description !== undefined) changes.description = description;
    if (status !== undefined) {
      const normalized = normalizeStatus(status);
      if (normalized === null) {
        return res.status(400).json({ error: 'Estado inválido. Use PENDIENTE, EN PROGRESO o COMPLETADA' });
      }
      changes.status = normalized;
    }

    const updated = store.update(id, changes);

    if (!updated) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    return res.status(200).json(updated);
  });

  app.delete('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const deleted = store.remove(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    return res.status(204).send();
  });

  app.use((req, res) => {
    const indexFile = path.join(publicDir, 'index.html');
    if (req.method === 'GET' && !req.path.startsWith('/tasks') && fs.existsSync(indexFile)) {
      return res.sendFile(indexFile);
    }
    return res.status(404).json({ error: 'Ruta no encontrada' });
  });

  return app;
}

module.exports = createApp;
