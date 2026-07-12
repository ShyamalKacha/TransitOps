import { Construction } from 'lucide-react'

// Generic placeholder for pages not yet built
export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        <Construction size={32} className="text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-700">{title}</h2>
      <p className="text-slate-400 text-sm max-w-xs">
        This page is coming soon. Tell the user to proceed with the next steps.
      </p>
    </div>
  )
}
