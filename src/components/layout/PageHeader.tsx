/**
 * PageHeader Component - Reusable page header with search and actions
 * Props: title, searchPlaceholder, actions
 */
import React from 'react'

const PageHeader = ({ 
  title, 
  searchPlaceholder = 'Search...',
  showSearch = true,
  actions = [],
  className = '' 
}) => {
  return (
    <header className={`hidden lg:flex items-center justify-between px-8 py-5 bg-background-light dark:bg-background-dark/50 backdrop-blur-sm sticky top-0 z-10 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      
      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2.5 w-64 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-700 dark:text-gray-200 shadow-sm transition-all"
              placeholder={searchPlaceholder}
              type="text"
            />
          </div>
        )}
        
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm ${
              action.variant === 'primary'
                ? 'bg-primary text-white hover:bg-orange-600 shadow-orange-200 dark:shadow-none'
                : 'bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {action.icon && (
              <span className="material-symbols-outlined text-lg">{action.icon}</span>
            )}
            {action.label}
          </button>
        ))}
        
        {/* Notification Bell */}
        <button className="relative p-2.5 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-600 dark:text-gray-400 hover:text-primary transition-colors shadow-sm">
          <span className="material-symbols-outlined icon-filled">notifications</span>
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark"></span>
        </button>
      </div>
    </header>
  )
}

export default PageHeader
