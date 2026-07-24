interface ToggleSwitchProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  id?: string
}

export default function ToggleSwitch({ checked, onChange, label, id }: ToggleSwitchProps) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3 select-none">
      {label && <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  )
}
