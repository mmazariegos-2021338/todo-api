import { useEffect, useState, type FormEvent } from 'react'
import { STATUSES, type Status, type Task, type TaskStats } from './types'

const emptyStats: TaskStats = {
  PENDIENTE: 0,
  'EN PROGRESO': 0,
  COMPLETADA: 0,
  total: 0,
}

function badgeClass(status: Status) {
  return status.startsWith('EN') ? 'EN' : status
}

export default function App() {
  const [version, setVersion] = useState('1.0')
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats>(emptyStats)
  const [filter, setFilter] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('PENDIENTE')
  const isV2 = version.startsWith('2')

  async function loadVersion() {
    const res = await fetch('/health')
    const data = (await res.json()) as { version?: string }
    const next = data.version || '1.0'
    setVersion(next)
    document.title = `TodoList v${next}`
  }

  async function loadTasks(nextFilter = filter, nextIsV2 = isV2) {
    const query = nextIsV2 && nextFilter ? `?status=${encodeURIComponent(nextFilter)}` : ''
    const res = await fetch(`/tasks${query}`)
    setTasks((await res.json()) as Task[])
    if (nextIsV2) {
      const statsRes = await fetch('/tasks/stats')
      setStats((await statsRes.json()) as TaskStats)
    }
  }

  useEffect(() => {
    loadVersion().then(() => undefined)
  }, [])

  useEffect(() => {
    loadTasks(filter, version.startsWith('2'))
  }, [version, filter])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    await fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status }),
    })
    setTitle('')
    setDescription('')
    setStatus('PENDIENTE')
    await loadTasks()
  }

  async function onStatusChange(id: number, nextStatus: Status) {
    await fetch(`/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    await loadTasks()
  }

  async function onEdit(task: Task) {
    const nextTitle = window.prompt('Nuevo título', task.title)
    if (!nextTitle) return
    const nextDescription = window.prompt('Nueva descripción', task.description)
    await fetch(`/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: nextTitle, description: nextDescription ?? '' }),
    })
    await loadTasks()
  }

  async function onDelete(id: number) {
    await fetch(`/tasks/${id}`, { method: 'DELETE' })
    await loadTasks()
  }

  return (
    <main>
      <h1>TodoList v{version}</h1>
      <p className="sub">
        Crear, listar, actualizar y eliminar tareas. Estados: PENDIENTE, EN PROGRESO y COMPLETADA.
      </p>

      {isV2 && (
        <section className="card">
          <div className="stats">
            <div className="stat"><strong>{stats.total}</strong>Total</div>
            <div className="stat"><strong>{stats.PENDIENTE}</strong>Pendiente</div>
            <div className="stat"><strong>{stats['EN PROGRESO']}</strong>En progreso</div>
            <div className="stat"><strong>{stats.COMPLETADA}</strong>Completada</div>
          </div>
        </section>
      )}

      <section className="card">
        <form onSubmit={onCreate}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" />
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUSES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button type="submit">Crear tarea</button>
        </form>
      </section>

      {isV2 && (
        <section className="card">
          <label htmlFor="filter">Filtrar por estado</label>
          <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todas</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </section>
      )}

      <section className="card">
        {tasks.length === 0 ? (
          <p className="meta">No hay tareas.</p>
        ) : (
          tasks.map((task) => (
            <article className="task" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span className={`badge ${badgeClass(task.status)}`}>{task.status}</span>
              </div>
              <div>{task.description}</div>
              <div className="meta">
                ID {task.id} · creada {new Date(task.createdAt).toLocaleString()}
              </div>
              <div className="row">
                <select
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value as Status)}
                >
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <button className="ghost" type="button" onClick={() => onEdit(task)}>Editar</button>
                <button className="danger" type="button" onClick={() => onDelete(task.id)}>Eliminar</button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
