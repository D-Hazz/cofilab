'use client'

import { Task } from '@/types'

interface TaskCardProps {
  task: Task
  onClick?: (task: Task) => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      className="p-4 rounded-xl shadow-md bg-white flex flex-col gap-2 cursor-pointer hover:shadow-lg transition"
      onClick={() => onClick?.(task)}
    >
      <h4 className="text-md font-semibold">{task.title}</h4>
      <p className="text-sm text-gray-500">{task.description}</p>
      <p className="text-sm">
        Status : <span className="font-medium">{task.status}</span>
      </p>
      <p className="text-sm">
        Reward : <span className="font-medium">{task.reward_sats} sats</span>
      </p>
      <p className="text-sm">
        Validated : <span className="font-medium">{task.validated ? '✅' : '❌'}</span>
      </p>
    </div>
  )
}
