// /cofilab-frontend/app/_components/TaskApplicationsManager.tsx
'use client'

import { Button } from '@/components/ui/button'
import { taskApplications } from '@/services/api'

type Application = {
  id: number
  task: number
  task_title: string
  applicant_username: string
  status: 'pending' | 'accepted' | 'rejected'
}

export function TaskApplicationsManager({
  applications,
  reload,
}: {
  applications: Application[]
  reload: () => void
}) {
  const handleAccept = async (id: number) => {
    await taskApplications.accept(id)
    reload()
  }

  const handleReject = async (id: number) => {
    await taskApplications.reject(id)
    reload()
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <div
          key={app.id}
          className="border rounded p-3 flex justify-between items-center"
        >
          <div>
            <p className="font-medium">{app.task_title}</p>
            <p className="text-sm text-gray-600">
              Candidat : {app.applicant_username}
            </p>
            <p className="text-xs text-gray-400">
              Statut : {app.status}
            </p>
          </div>

          {app.status === 'pending' && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleAccept(app.id)}>
                Accepter
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(app.id)}
              >
                Rejeter
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
