import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}> = ({ title, children, right, collapsible = false, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow p-5 mb-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
        {right}
      </div>
      {isOpen && children}
    </div>
  );
};

export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-sm font-medium text-gray-600">{children}</label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={
      "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 " +
      (props.className || "")
    }
  />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={
      "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 " +
      (props.className || "")
    }
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={
      "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10 " +
      (props.className || "")
    }
  />
);

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'soft' | 'outline' | 'danger' }
> = ({ variant = 'solid', className = '', ...props }) => {
  const base =
    'inline-flex items-center justify-center rounded-2xl px-3.5 py-2 text-sm font-medium transition active:scale-[.98]';
  const styles = {
    solid: 'bg-black text-white hover:bg-black/90',
    soft: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50 bg-white',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return <button {...props} className={`${base} ${styles[variant]} ${className}`} />;
};

export const Badge: React.FC<{ children: React.ReactNode; tone?: 'gray' | 'red' | 'green' | 'blue' }> = ({
  children,
  tone = 'gray',
}) => (
  <span
    className={
      `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ` +
      (tone === 'red'
        ? 'border-red-200 bg-red-50 text-red-700'
        : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : tone === 'blue'
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : 'border-gray-200 bg-gray-50 text-gray-700')
    }
  >
    {children}
  </span>
);

export const FileInput: React.FC<{
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}> = ({ label, accept, onChange, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div>
      <Label>{label}</Label>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
};
