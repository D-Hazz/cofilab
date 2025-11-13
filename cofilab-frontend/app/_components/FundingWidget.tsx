'use client'
interface FundingWidgetProps {
  funded: number
  total: number
}

export default function FundingWidget({ funded, total }: FundingWidgetProps) {
  const percent = total > 0 ? Math.min((funded / total) * 100, 100) : 0

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{funded.toLocaleString()} sats</span>
        <span>{percent.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#f2a900] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
