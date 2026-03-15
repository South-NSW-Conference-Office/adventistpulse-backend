import { ReactNode } from 'react';
import { tokens, cn } from '@/lib/theme';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
  className?: string;
}

export function PageLayout({ title, subtitle, breadcrumbs, children, className }: PageLayoutProps) {
  return (
    <div className={cn('min-h-screen', tokens.bg.page)}>
      <div className={cn('mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8', className)}>
        {/* Header */}
        <div className="mb-8 space-y-4">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex" aria-label="Breadcrumb">
              <ol role="list" className="flex items-center space-x-4">
                {breadcrumbs.map((item, index) => (
                  <li key={index}>
                    <div className="flex items-center">
                      {index > 0 && (
                        <svg
                          className={cn('mr-4 h-5 w-5 flex-shrink-0', tokens.text.muted)}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="m5.555 17.776 4-16 .894.448-4 16-.894-.448z" />
                        </svg>
                      )}
                      {item.href ? (
                        <a
                          href={item.href}
                          className={cn('text-sm font-medium hover:underline', tokens.text.accent)}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span className={cn('text-sm font-medium', tokens.text.muted)}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          
          {/* Page title and subtitle */}
          <div>
            <h1 className={cn('text-3xl font-bold tracking-tight sm:text-4xl', tokens.text.heading)}>
              {title}
            </h1>
            {subtitle && (
              <p className={cn('mt-2 text-lg', tokens.text.body)}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Page content */}
        <div>{children}</div>
      </div>
    </div>
  );
}