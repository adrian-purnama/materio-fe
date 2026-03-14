import { useState, useEffect } from 'react'
import { formatNumber, parseFormattedNumber } from '../helper/formatHelper'

/**
 * Input that displays numbers with dot thousands separator (e.g. 180.000).
 * value/onChange use raw numbers; display is formatted.
 * Optional: className, placeholder, min, max, decimals, disabled.
 */
const FormattedNumberInput = ({
  value,
  onChange,
  className = '',
  placeholder = '',
  min,
  max,
  decimals = 0,
  disabled = false,
  ...rest
}) => {
  const [display, setDisplay] = useState('')
  const [focused, setFocused] = useState(false)

  const numValue = value != null && value !== '' ? Number(value) : NaN
  const isValidNum = !Number.isNaN(numValue)

  useEffect(() => {
    if (!focused) {
      setDisplay(isValidNum ? formatNumber(numValue, decimals) : '')
    }
  }, [value, focused, decimals, isValidNum, numValue])

  const handleChange = (e) => {
    const raw = e.target.value
    const parsed = parseFormattedNumber(raw)
    if (Number.isNaN(parsed)) {
      setDisplay(raw)
      if (raw.trim() === '') onChange?.(0)
      return
    }
    let n = parsed
    if (min != null && n < min) n = min
    if (max != null && n > max) n = max
    onChange?.(n)
    setDisplay(formatNumber(n, decimals))
  }

  const handleBlur = () => {
    setFocused(false)
    if (display.trim() === '') {
      onChange?.(0)
      setDisplay('')
      return
    }
    const parsed = parseFormattedNumber(display)
    if (Number.isNaN(parsed)) {
      setDisplay(isValidNum ? formatNumber(numValue, decimals) : '')
      return
    }
    let n = parsed
    if (min != null && n < min) n = min
    if (max != null && n > max) n = max
    onChange?.(n)
    setDisplay(formatNumber(n, decimals))
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      {...rest}
    />
  )
}

export default FormattedNumberInput
