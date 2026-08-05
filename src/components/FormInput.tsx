/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface FormInputProps {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  actionButton?: React.ReactNode;
  hint?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  options = [],
  placeholder = '',
  error,
  required = false,
  actionButton,
  hint,
}) => {
  const baseInputStyles = `
    w-full px-3 py-2 bg-white border text-slate-800 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500
    ${error ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-100 focus:border-rose-400' : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500'}
  `;

  return (
    <div className="flex flex-col gap-1.5 w-full" id={`container-${id}`}>
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {error && (
          <span className="text-xs text-rose-500 font-medium animate-pulse" id={`error-msg-${id}`}>
            {error}
          </span>
        )}
      </div>

      <div className="relative flex gap-2">
        {type === 'select' ? (
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputStyles} appearance-none cursor-pointer pr-10`}
          >
            {(!value || !options.includes(value)) && (
              <option value="" disabled hidden>
                -- Pilih {label} --
              </option>
            )}
            {options.map((option) => (
              <option key={option} value={option} className="bg-white text-slate-800">
                {option}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className={`${baseInputStyles} resize-none`}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={baseInputStyles}
          />
        )}

        {/* Custom side action button (e.g. GPS button) */}
        {actionButton && (
          <div className="flex-shrink-0 flex items-stretch">
            {actionButton}
          </div>
        )}

        {/* Custom dropdown arrow indicator for select elements */}
        {type === 'select' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans" id={`hint-${id}`}>
          {hint}
        </p>
      )}
    </div>
  );
};
