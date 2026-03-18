/**
 * Provider pour le Service Worker
 * Enregistre le SW et lance le téléchargement offline-first
 *
 * Stratégie:
 * 1. Le SW se charge et cache les assets statiques
 * 2. Dès que l'utilisateur est authentifié, lance le warmup data
 * 3. Si l'utilisateur passe offline puis revient, relance le warmup
 */

'use client';


export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  // const { isSupported, isRegistered } = useServiceWorker();
  // const warmupStarted = useRef(false);

  // useEffect(() => {
  //   if (!isSupported || !isRegistered) return;

  //   console.log('[PWA] Service Worker actif et prêt');

    // Fonction pour tenter le warmup
    // const tryWarmup = () => {
    //   const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    //   if (token && !warmupStarted.current) {
    //     warmupStarted.current = true;
    //     console.log('[PWA] 🚀 Lancement du téléchargement offline-first...');
    //     dataWarmup.startWarmup();
    //   }
    // };

    // // Lancer le warmup après un petit délai pour laisser l'app se stabiliser
    // const timer = setTimeout(tryWarmup, 3000);

    // // Relancer le warmup quand on revient online
    // const handleOnline = () => {
    //   console.log('[PWA] ↑ Connexion rétablie, vérification du cache...');
    //   warmupStarted.current = false;
    //   setTimeout(tryWarmup, 2000);
    // };

    // window.addEventListener('online', handleOnline);

    // // Écouter les événements de login custom pour déclencher immédiatement
    // const handleLogin = () => {
    //   console.log('[PWA] 🔐 Login détecté, démarrage warmup...');
    //   warmupStarted.current = false;
    //   // Petit délai pour laisser le temps au token d'être stocké
    //   setTimeout(tryWarmup, 1000);
    // };

    // window.addEventListener('loura:login', handleLogin);

    // return () => {
    //   clearTimeout(timer);
    //   window.removeEventListener('online', handleOnline);
    //   window.removeEventListener('loura:login', handleLogin);
    // };
  // }, [isSupported, isRegistered]);

  return (
    <>
      {children}
      {/* <ServiceWorkerUpdatePrompt /> */}
      {/* <CacheProgressIndicator /> */}
    </>
  );
}

