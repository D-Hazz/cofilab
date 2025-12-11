"use client"

import { useQuery } from "@tanstack/react-query"
import { users } from "@/services/api"  // tu as déjà ce bloc
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UserSelect({ value, onChange }) {
  const { data: list = [] } = useQuery({
    queryKey: ["users_list"],
    queryFn: users.list
  })

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Assigner un utilisateur" />
      </SelectTrigger>

      <SelectContent>
        {list.map((u) => (
          <SelectItem key={u.id} value={String(u.id)}>
            {u.username}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
