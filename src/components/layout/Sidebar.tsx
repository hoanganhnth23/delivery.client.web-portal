/**
 * Sidebar Component - Reusable sidebar for all dashboard pages
 * Props: brand, menuItems, bottomContent
 */
import React from 'react'
import { Link } from 'react-router-dom'

const Sidebar = ({ brand, menuItems, bottomContent, className = '' }) => {
  return (
    <aside className={`hidden lg:flex flex-col w-72 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-shrink-0 transition-colors duration-200 ${className}`}>
      <div className="flex h-full flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Brand Section */}
          <div className="flex items-center gap-4 px-2">
            {brand.avatar && (
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-12 shadow-sm border-2 border-primary"
                style={{backgroundImage: `url('${brand.avatar}')`}}
              />
            )}
            {brand.icon && (
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined">{brand.icon}</span>
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight">
                {brand.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                {brand.subtitle}
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <React.Fragment key={item.to}>
                {item.divider ? (
                  <div className="h-px bg-border-light dark:bg-border-dark my-2 mx-4" />
                ) : (
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 font-bold'
                        : item.danger
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className={`material-symbols-outlined ${item.active ? 'icon-filled' : ''}`}>
                      {item.icon}
                    </span>
                    <span className={`text-sm ${item.active ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Bottom Content */}
        {bottomContent && <div className="mt-auto">{bottomContent}</div>}
      </div>
    </aside>
  )
}

export default Sidebar
