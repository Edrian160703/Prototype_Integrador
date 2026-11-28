import {
  CREATION_DATE_RANGES,
  type CreationDateRange,
} from '../../utils/adminDateFilter'

export default function CreationDateFilter({
  value,
  onChange,
}: {
  value: CreationDateRange
  onChange: (value: CreationDateRange) => void
}) {
  return (
    <label className="creation-date-filter">
      <span>Creación</span>
      <select
        aria-label="Filtrar por fecha de creación"
        value={value}
        onChange={(event) => {
          const range = CREATION_DATE_RANGES.find(
            (item) => item.value === event.target.value,
          )
          if (range) onChange(range.value)
        }}
      >
        {CREATION_DATE_RANGES.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
    </label>
  )
}
