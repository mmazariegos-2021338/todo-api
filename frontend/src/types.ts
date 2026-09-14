export const STATUSES = ['PENDIENTE', 'EN PROGRESO', 'COMPLETADA'] as const

export type Status = (typeof STATUSES)[number]

export type Task = {
  id: number
  title: string
  description: string
  status: Status
  createdAt: string
}

export type TaskStats = {
  PENDIENTE: number
  'EN PROGRESO': number
  COMPLETADA: number
  total: number
}
