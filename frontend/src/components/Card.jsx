import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  actions,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footer,
  ...props
}) {
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs transition-shadow duration-200 hover:shadow-sm ${className}`}
      {...props}
    >
      {(title || subtitle || Icon || actions) && (
        <div
          className={`px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3 ${headerClassName}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-[var(--text)] tracking-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-[var(--border)] bg-slate-50/60 dark:bg-slate-900/40 rounded-b-xl text-xs text-[var(--text-muted)]">
          {footer}
        </div>
      )}
    </div>
  );
}
