import { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const baseClassName =
  'rounded-xl px-5 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 ease-out disabled:cursor-not-allowed';

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:translate-y-0 disabled:bg-indigo-400 disabled:shadow-none dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:disabled:bg-indigo-800',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:translate-y-0 disabled:text-slate-400 disabled:bg-slate-100 disabled:shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-500',
};

export default function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseClassName} ${variantClassName[variant]} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      {...props}
    />
  );
}
