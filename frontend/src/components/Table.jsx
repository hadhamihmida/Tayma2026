import React from 'react';

export function Table({ children, className = '', ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
      <table className={`w-full text-left text-xs text-[var(--text)] ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead
      className={`bg-[var(--primary-light)] text-[var(--primary-dark)] font-semibold text-[11px] uppercase tracking-wider border-b border-[var(--border)] select-none ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`divide-y divide-[var(--border)] ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr
      className={`transition-colors duration-150 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={`px-4 py-3.5 text-left font-semibold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`px-4 py-3.5 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

export function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = ''
}) {
  return (
    <div
      className={`px-4 py-3 border-t border-[var(--border)] bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-[var(--text-muted)] ${className}`}
    >
      <div>
        Affichage de <span className="font-semibold text-[var(--text)]">{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> à{' '}
        <span className="font-semibold text-[var(--text)]">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{' '}
        sur <span className="font-semibold text-[var(--text)]">{totalItems}</span> résultats
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Précédent
        </button>
        <span className="px-2 font-medium text-[var(--text)]">
          {currentPage} / {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

export default {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination
};
