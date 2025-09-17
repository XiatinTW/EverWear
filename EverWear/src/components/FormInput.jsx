import React from 'react';

export default function FormInput({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  className = ''
}) {
  return (
    <div className={`form-input-container ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className="block text-sm font-medium text-[var(--color-base_text_1)] mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent_1)] focus:border-transparent transition-colors"
      />
    </div>
  );
}