/**
 * Layout pour les pages d'authentification
 */

import React from 'react';

export interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          {subtitle && (
            <div className="mt-2 text-center text-sm text-gray-600">
              {subtitle}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
