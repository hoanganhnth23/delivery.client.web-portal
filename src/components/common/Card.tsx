/**
 * Card Component - Reusable card container
 * Props: children, title, actions, className
 */
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

const Card = ({ 
  children, 
  title, 
  subtitle,
  actions,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}: CardProps) => {
  return (
    <div className={`bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm ${className}`}>
      {(title || actions) && (
        <div className={`flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark ${headerClassName}`}>
          <div>
            {title && (
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      <div className={bodyClassName || 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;
