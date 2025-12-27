'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { HiOutlineQrCode } from 'react-icons/hi2';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTodayAttendance } from '@/lib/services/hr';

/**
 * Floating Action Button pour un accès rapide au scan QR
 * Visible partout dans l'application (sauf sur la page de scan)
 * Se masque automatiquement si l'utilisateur a déjà pointé son départ aujourd'hui
 */
export function QRScanFAB() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgSlug = params.slug as string;
  const [isHovered, setIsHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier le statut de pointage d'aujourd'hui
  useEffect(() => {
    const checkTodayAttendance = async () => {
      try {
        const attendance = await getTodayAttendance(orgSlug);
        // Si l'utilisateur a déjà pointé son départ (check_out), masquer le FAB
        if (attendance?.check_out) {
          setHasCheckedOut(true);
        }
      } catch (error) {
        // Pas de pointage aujourd'hui ou erreur, afficher le FAB
        console.log('No attendance today or error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orgSlug) {
      checkTodayAttendance();
    }
  }, [orgSlug]);

  // Arrêter le pulse après quelques secondes pour ne pas distraire
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPulsing(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Ne pas afficher le FAB si:
  // - On est sur la page de scan
  // - L'utilisateur a déjà pointé son départ aujourd'hui
  // - L'utilisateur a fermé manuellement le FAB
  // - En cours de chargement
  if (pathname?.includes('/qr-scan') || hasCheckedOut || isDismissed || isLoading) {
    return null;
  }

  const handleScan = () => {
    router.push(`/apps/${orgSlug}/hr/attendance/qr-scan`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Bouton de fermeture */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsDismissed(true);
        }}
        className="absolute -top-2 -left-2 z-10 h-7 w-7 rounded-full bg-gray-900 dark:bg-gray-700 text-white shadow-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
        aria-label="Masquer le bouton de scan"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Tooltip étendu au survol */}
      <div
        className={`absolute bottom-full right-0 mb-3 transition-all duration-300 ${
          isHovered
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="px-4 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-xl whitespace-nowrap">
          <div className="font-semibold mb-1">Scanner QR Code</div>
          <div className="text-xs text-gray-300">Pointer votre arrivée/sortie</div>
          <div className="absolute top-full right-6 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900 dark:border-t-gray-800" />
          </div>
        </div>
      </div>

      {/* Floating Button avec effet de pulse initial */}
      <div className="relative">
        {/* Pulse ring pour attirer l'attention au début */}
        {isPulsing && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-ping opacity-30" />
        )}

        {/* Glow effect permanent */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />

        {/* Main button */}
        <Button
          onClick={handleScan}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          size="lg"
          className="relative h-16 w-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-4 border-white dark:border-gray-800"
          aria-label="Scanner un QR code pour pointer"
        >
          <HiOutlineQrCode className="h-8 w-8 transition-transform duration-300 group-hover:rotate-12" />
        </Button>

        {/* Badge d'indication (petit point) */}
        <div className="absolute -top-1 -right-1 flex h-5 w-5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-pulse" />
          <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 border-2 border-white dark:border-gray-800" />
        </div>
      </div>

      {/* Keyboard shortcut hint (optionnel, pour l'accessibilité) */}
      {isHovered && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
            Clic
          </kbd>
        </div>
      )}
    </div>
  );
}
