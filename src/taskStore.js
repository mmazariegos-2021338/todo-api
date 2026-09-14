'use strict';

const STATUSES = ['PENDIENTE', 'EN PROGRESO', 'COMPLETADA'];

function normalizeStatus(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toUpperCase().replace(/_/g, ' ');
  return STATUSES.includes(normalized) ? normalized : null;
}

class TaskStore {
  constructor() {
    this.tasks = new Map();
    this.nextId = 1;
  }

  getAll(statusFilter) {
    const tasks = Array.from(this.tasks.values());
    if (!statusFilter) {
      return tasks;
    }
    return tasks.filter((task) => task.status === statusFilter);
  }

  getById(id) {
    return this.tasks.get(id);
  }

  stats() {
    const counts = { PENDIENTE: 0, 'EN PROGRESO': 0, COMPLETADA: 0, total: this.tasks.size };
    for (const task of this.tasks.values()) {
      counts[task.status] += 1;
    }
    return counts;
  }

  create({ title, description = '', status }) {
    const id = this.nextId;
    this.nextId += 1;

    const task = {
      id,
      title,
      description,
      status: status || 'PENDIENTE',
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
module.exports.STATUSES = STATUSES;
module.exports.normalizeStatus = normalizeStatus;
