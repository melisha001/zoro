import React from 'react';

/**
 * Reusable MoneyInput component for all currency / fee fields.
 * - Prevents up/down arrow spinners
 * - Strips leading zeros (preserves single "0")
 * - Enforces numeric digits only
 * - Blocks mouse wheel alterations
 */
export default function MoneyInput({
  value = '',
  onChange,
  onValueChange,
  placeholder = 'e.g. 500',
  required = false,
  disabled = false,
  className = '',
  id,
  name,
  ...rest
}) {
  const displayVal = value !== null && value !== undefined ? String(value) : '';

  const handleChange = (e) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    const clean = digitsOnly ? digitsOnly.replace(/^0+(?=\d)/, '') : '';
    e.target.value = clean;

    if (onValueChange) {
      onValueChange(clean);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
    if (rest.onKeyDown) {
      rest.onKeyDown(e);
    }
  };

  const handleWheel = (e) => {
    e.target.blur();
    if (rest.onWheel) {
      rest.onWheel(e);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      id={id}
      name={name}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      value={displayVal}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      className={`appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className}`}
      {...rest}
    />
  );
}
