export default function MetricCard({
  title,
  value,
  footer
}: { title: string; value: string | number; footer?: string }) {
  return (
    <div className="bg-white rounded shadow-sm p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {footer && <div className="text-xs text-gray-400 mt-1">{footer}</div>}
    </div>
  )
}
