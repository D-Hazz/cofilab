// cofilab-frontend/app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BreezProvider } from "@/contexts/BreezContext"

const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BreezProvider>
        {children}
      </BreezProvider>
    </QueryClientProvider>
  )
}
