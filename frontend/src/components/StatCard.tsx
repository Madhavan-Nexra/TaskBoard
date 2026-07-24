interface StatCardProps {
  label: string
  value: number | string
  accentClass?: string // text color class for the big number
  delta?: string
}

export default function StatCard({ label, value, accentClass = 'text-slate-900 dark:text-white', delta }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accentClass}`}>{value}</p>
      {delta && <p className="mt-1 text-xs font-medium text-blue-600">{delta}</p>}
    </div>
  )
}
