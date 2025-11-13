'use client'

import { useEffect, useState } from 'react'
import { tasks } from '@/services/api'
import TaskCard from '@/app/_components/TaskCard'
import { Button } from '@/components/ui/button'

export default function TasksPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await tasks.list()
        setData(res)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <Button
        onClick={async () => {
          const title = prompt('Task title:')
          if (!title) return
          const desc = prompt('Description:')
          const newTask = await tasks.create({
            title,
            description: desc,
            reward_sats: 1000,
          })
          setData((prev) => [...prev, newTask])
        }}
      >
        + New Task
      </Button>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  )
}
