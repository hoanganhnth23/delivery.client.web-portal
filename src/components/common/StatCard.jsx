/**
 * StatCard Component - Reusable statistics card
 * Props: icon, label, value, change, color
 */
import React from 'react'

const StatCard = ({ 
  icon, 
  label, 
  value, 
  change, 
  iconBgColor = 'bg-orange-50 dark:bg-orange-900/20',
  iconColor = 'text-primary',
  className = ''
}) => {
  return (
    <div className={`bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow group ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 ${iconBgColor} rounded-xl ${iconColor}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            change.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : change.type === 'warning'
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
              : change.type === 'danger'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }`}>
            {change.value}
          </span>
        )}
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
    </div>
  )
}

export default StatCard
