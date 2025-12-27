'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { UserCircle, Briefcase } from 'lucide-react';

export default function AuthSelectionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-slate-100">
            Bienvenue sur Loura
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-slate-400">
            Choisissez votre type de compte pour continuer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {/* Carte Administrateur */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-8 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-xl">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  Administrateur
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                  Gérez vos organisations et employés
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/admin')}
                  className="w-full"
                  size="lg"
                >
                  Se connecter
                </Button>

                <Link
                  href="/core/register"
                  className="block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Créer un compte administrateur
                </Link>
              </div>
            </div>
          </div>

          {/* Carte Employé */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-8 hover:border-green-500 dark:hover:border-green-400 transition-all hover:shadow-xl">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <UserCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  Employé
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                  Accédez à votre espace personnel
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/employee')}
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  Se connecter
                </Button>

                <p className="text-sm text-gray-500 dark:text-slate-500">
                  Votre compte est créé par votre administrateur
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-slate-500">
            Besoin d'aide ?{' '}
            <Link
              href="/support"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Contactez le support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
