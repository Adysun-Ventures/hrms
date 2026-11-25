import { ICONS, Icon } from './icons.jsx';

/** Wrapper kept compatible with slot-profile; HRMS DashboardLayout provides outer chrome and breadcrumbs. */
export function Page({ children }) {
  return <>{children}</>;
}

export function Card({ className = '', children }) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

/** Symmetrical 3-column card header matching slot-profile ADR-012. */
export function CardHeader({ onBack, backLabel = 'Go back', title, extra, actions }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div>{onBack ? <CircleButton icon={ICONS.back} label={backLabel} onClick={onBack} /> : null}</div>
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-center text-base font-bold text-brand-600">{title}</h1>
        {extra}
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 lg:col-span-1">{actions}</div>
    </div>
  );
}

const BUTTON = {
  primary: 'bg-emerald-500 text-white enabled:hover:bg-emerald-600',
  warning: 'bg-amber-400 text-white enabled:hover:bg-amber-500',
  dark: 'bg-gray-800 text-white enabled:hover:bg-gray-900',
  danger: 'border border-red-200 bg-white text-red-600 enabled:hover:bg-red-50',
  plain: 'border border-gray-200 bg-white text-gray-700 enabled:hover:bg-gray-50',
};

export function Button({ variant = 'primary', size = 'md', icon, children, className = '', ...rest }) {
  const sz = size === 'sm' ? 'h-7 gap-1 px-3 text-xs' : 'h-8 gap-1.5 px-3.5 text-sm';
  return (
    <button
      type="button"
      className={`flex items-center rounded-full font-bold shadow-sm disabled:opacity-50 ${sz} ${BUTTON[variant]} ${className}`}
      {...rest}
    >
      {icon && <Icon d={icon} className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  );
}

export function CircleButton({ icon, label, dim, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
    >
      <Icon d={icon} className={`h-4 w-4 ${dim ? 'opacity-40' : ''}`} />
    </button>
  );
}
