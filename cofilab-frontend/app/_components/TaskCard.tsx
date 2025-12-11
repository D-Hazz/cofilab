// app/_components/TaskCard.tsx
"use client"

import { Task } from "@/types"
import { User2, CheckCircle2, Clock, Award } from "lucide-react"

interface TaskCardProps {
  task: Task
  onClick?: (task: Task) => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      className="p-4 rounded-xl shadow-sm bg-white flex flex-col gap-3 cursor-pointer hover:shadow-md border border-gray-100 transition"
      onClick={() => onClick?.(task)}
    >
      {/* Title */}
      <h4 className="text-lg font-semibold text-gray-900">{task.title}</h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        {task.status === "done" ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <Clock className="w-4 h-4 text-gray-400" />
        )}
        <span className="font-medium capitalize">
          {task.status === "done" ? "Terminé" : "À faire"}
        </span>
      </div>

      {/* Reward */}
      <div className="flex items-center gap-2 text-sm">
        <Award className="w-4 h-4 text-yellow-600" />
        <span className="font-medium">
          {task.reward_sats?.toLocaleString()} sats
        </span>
      </div>

      {/* Validation Status */}
      <p className="text-sm">
        Validée :{" "}
        <span className="font-medium">
          {task.validated ? "✅ Oui" : "❌ Non"}
        </span>
      </p>

      {/* Assigned user */}
      <div className="flex items-center gap-2 text-sm mt-1">
        <User2 className="w-4 h-4 text-blue-600" />

        {task.assigned_to_username ? (
          <span>
            Assigné à :{" "}
            <strong className="text-gray-900">{task.assigned_to_username}</strong>
          </span>
        ) : (
          <span className="text-gray-400 italic">Pas encore assigné</span>
        )}
      </div>
    </div>
  )
}
