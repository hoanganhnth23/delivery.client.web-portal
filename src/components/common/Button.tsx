/**
 * Button Component - Reusable button with variants
 * Props: children, variant, size, icon, onClick
 */
import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}: ButtonProps) => {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-orange-600 shadow-md shadow-orange-200 dark:shadow-none',
    secondary: 'bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined text-lg">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-lg">{icon}</span>
      )}
    </button>
  );
};

export default Button
