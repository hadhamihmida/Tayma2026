import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'approved' | 'pending' | 'rejected' | 'draft' | 'primary' | 'default'
  dot = true,
  icon: Icon,
  className = '',
  ...props
}) {
  const variantStyles = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    draft: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    primary: 'bg-[var(--primary-light)] text-[var(--primary)] border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    default: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  };

  const dotColors = {
    approved: 'bg-emerald-500',
    pending: 'bg-amber-500',
    rejected: 'bg-rose-500',
    draft: 'bg-slate-400',
    primary: 'bg-[var(--primary)]',
    default: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant] || dotColors.default
          }`}
        />
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
