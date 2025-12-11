"use client"
import { ClipboardList, CheckCircle, Trash, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TaskItem({
  task,
  onEdit,
  onDelete
}) {
  return (
    <div className="p-3 border rounded-lg flex justify-between items-start hover:bg-gray-50 transition">
      <div className="flex-1 pr-4">
        <h3 className="font-medium">{task.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>

        <p className="text-xs text-gray-400 mt-1">
          Assigné à : <strong>{task.assigned_to?.username || "Aucun"}</strong>
        </p>
      </div>

      <div className="flex flex-col items-end space-y-2">
        <div className="flex items-center space-x-1 text-sm">
          {task.status === "done" ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <ClipboardList className="w-4 h-4 text-gray-400" />
          )}
          <span>{task.status === "done" ? "Terminé" : "À faire"}</span>
        </div>

        <span className="font-bold text-sm text-yellow-600">
          {(task.reward_sats ?? 0).toLocaleString()} sats
        </span>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => onEdit(task)}>
            <Pencil className="w-4" />
          </Button>

          <Button variant="destructive" size="icon" onClick={() => onDelete(task.id)}>
            <Trash className="w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
