'use strict';

/**
 * Almacén de tareas en memoria.
 * Se usa una clase para encapsular el estado y evitar variables globales mutables,
 * lo cual además facilita las pruebas unitarias.
 */
class TaskStore {
  constructor() {
    this.tasks = new Map();
    this.nextId = 1;
  }

  getAll() {
    return Array.from(this.tasks.values());
  }

  getById(id) {
    return this.tasks.get(id);
  }

  create({ title, description = '' }) {
    const id = this.nextId;
    this.nextId += 1;

    const task = {
      id,
      title,
      description,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(id, task);
    return task;
  }

  update(id, changes) {
    const existing = this.tasks.get(id);
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...changes,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(id, updated);
    return updated;
  }

  remove(id) {
    return this.tasks.delete(id);
  }

  clear() {
    this.tasks.clear();
    this.nextId = 1;
  }
}

module.exports = TaskStore;
