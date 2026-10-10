import React from 'react';
import { Phone, Check, AlertCircle } from 'lucide-react';
import { sanitizePhone, validatePhone } from '../../utils/phoneValidator';

/**
 * Reusable PhoneInput component for 10-digit Indian mobile numbers.
 * Features:
 * - Numeric-only input with leading-zero handling and max 10 digits
 * - Mobile numeric keyboard (inputMode="numeric", pattern="[0-9]*")
 * - Live inline feedback while typing:
 *     - If first digit is not 6-9: "Mobile number must start with 6, 7, 8 or 9"
 *     - When fewer than 10 digits: "X/10 digits" counter
 *     - When valid (10 digits starting with 6-9): green checkmark indicator
 * - Clears errors as soon as the value becomes valid
 */
export default function PhoneInput({
  value = '',
  onChange,
  onValueChange,
  name = 'phone',
  id,
  placeholder = 'e.g. 9876543210',
  required = false,
  disabled = false,
  className = '',
  error = '',
  onErrorClear,
  showIcon = false,
  ...rest
}) {
  const phoneVal = sanitizePhone(value);
  const isValid = validatePhone(phoneVal);
  const hasStarted = phoneVal.length > 0;
  const startsWithInvalid = hasStarted && !['6', '7', '8', '9'].includes(phoneVal[0]);
  const isTooShort = hasStarted && !startsWithInvalid && phoneVal.length < 10;

  const handleChange = (e) => {
    const raw = e?.target ? e.target.value : e;
    const sanitized = sanitizePhone(raw);

    if (onErrorClear && (validatePhone(sanitized) || sanitized !== phoneVal)) {
      onErrorClear();
    }

    if (onChange) {
      const syntheticEvent = {
        target: { name: name || 'phone', value: sanitized },
        currentTarget: { name: name || 'phone', value: sanitized },
        value: sanitized,
        preventDefault: () => e?.preventDefault?.(),
        stopPropagation: () => e?.stopPropagation?.()
      };
      onChange(syntheticEvent);
    }
    if (onValueChange) {
      onValueChange(sanitized);
    }
  };

  // Determine feedback message and state
  let feedbackText = null;
  let feedbackType = null; // 'error' | 'counter' | 'valid'

  if (hasStarted) {
    if (startsWithInvalid) {
      feedbackText = 'Mobile number must start with 6, 7, 8 or 9';
      feedbackType = 'error';
    } else if (isTooShort) {
      feedbackText = `${phoneVal.length}/10 digits`;
      feedbackType = 'counter';
    } else if (isValid) {
      feedbackText = 'Valid mobile number';
      feedbackType = 'valid';
    }
  } else if (error) {
    feedbackText = error;
    feedbackType = 'error';
  }

  const borderClass = isValid
    ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
    : (startsWithInvalid || (error && !hasStarted))
    ? 'border-rose-500 bg-rose-50/30 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
    : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20';

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {showIcon && (
          <Phone className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
        )}
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          id={id}
          name={name}
          placeholder={placeholder}
          value={phoneVal}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={`w-full ${showIcon ? 'pl-10' : 'px-4'} pr-9 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all ${borderClass} ${className}`}
          {...rest}
        />
        {isValid && (
          <div className="absolute right-3 text-emerald-600 flex items-center pointer-events-none" title="Valid 10-digit mobile number">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        )}
      </div>

      {feedbackType === 'error' && (
        <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{feedbackText}</span>
        </p>
      )}

      {feedbackType === 'counter' && (
        <p className="text-[11px] font-semibold text-slate-500 mt-1">
          {feedbackText}
        </p>
      )}

      {feedbackType === 'valid' && (
        <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1 animate-in fade-in">
          <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
          <span>Valid 10-digit mobile number</span>
        </p>
      )}
    </div>
  );
}
