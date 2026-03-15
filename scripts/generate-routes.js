#!/usr/bin/env node
/**
 * Script de génération exhaustive de toutes les routes Next.js
 * Scanne le dossier app/ pour détecter toutes les routes possibles
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '../app');
const OUTPUT_FILE = path.join(__dirname, '../public/routes-manifest.json');

/**
 * Routes dynamiques connues à remplir avec des exemples
 * Format: { pattern: '/apps/[slug]', examples: ['org1', 'org2'] }
 */
const DYNAMIC_ROUTE_EXAMPLES = {
  '[slug]': ['demo-org', 'test-org'], // Exemples pour les slugs d'organisations
  '[id]': ['1', '2', '3'], // Exemples pour les IDs
  '[employeeId]': ['1', '2'], // Exemples pour les IDs employés
  '[leaveId]': ['1'], // Exemples pour les congés
};

/**
 * Routes à ignorer
 */
const IGNORE_PATTERNS = [
  /\/api\//,
  /\/_next\//,
  /\/\./,  // Fichiers cachés
  /node_modules/,
];

/**
 * Détermine si un chemin doit être ignoré
 */
function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Vérifie si un dossier contient page.tsx ou layout.tsx
 */
function isRoute(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files.some(file =>
      file === 'page.tsx' ||
      file === 'page.ts' ||
      file === 'page.jsx' ||
      file === 'page.js'
    );
  } catch {
    return false;
  }
}

/**
 * Convertit un chemin de dossier en route Next.js
 */
function pathToRoute(dirPath) {
  let route = dirPath
    .replace(APP_DIR, '')
    .replace(/\\/g, '/')
    .replace(/\/page\.(tsx|ts|jsx|js)$/, '');

  // Supprimer les groupes de routes (xxx)
  route = route.replace(/\/\([^)]+\)/g, '');

  // Normaliser
  if (!route.startsWith('/')) {
    route = '/' + route;
  }
  if (route.endsWith('/') && route !== '/') {
    route = route.slice(0, -1);
  }

  return route || '/';
}

/**
 * Génère toutes les variations possibles d'une route dynamique
 */
function expandDynamicRoute(route) {
  const routes = [route];

  // Trouver tous les segments dynamiques [xxx]
  const dynamicSegments = route.match(/\[([^\]]+)\]/g);

  if (!dynamicSegments) {
    return routes;
  }

  // Pour chaque segment dynamique, générer des exemples
  dynamicSegments.forEach(segment => {
    const key = segment;
    const examples = DYNAMIC_ROUTE_EXAMPLES[key] || ['example'];

    const newRoutes = [];
    routes.forEach(r => {
      examples.forEach(example => {
        newRoutes.push(r.replace(segment, example));
      });
    });

    routes.length = 0;
    routes.push(...newRoutes);
  });

  return routes;
}

/**
 * Scanne récursivement le dossier app/
 */
function scanDirectory(dirPath, routes = new Set()) {
  if (shouldIgnore(dirPath)) {
    return routes;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    // Vérifier si c'est une route
    if (isRoute(dirPath)) {
      const route = pathToRoute(dirPath);

      // Si c'est une route dynamique, générer les variations
      if (route.includes('[')) {
        const expanded = expandDynamicRoute(route);
        expanded.forEach(r => routes.add(r));
      } else {
        routes.add(route);
      }
    }

    // Scanner les sous-dossiers
    entries.forEach(entry => {
      if (entry.isDirectory()) {
        const subDirPath = path.join(dirPath, entry.name);
        scanDirectory(subDirPath, routes);
      }
    });

  } catch (error) {
    console.warn(`Erreur lors du scan de ${dirPath}:`, error.message);
  }

  return routes;
}

/**
 * Routes additionnelles manuelles (si nécessaire)
 */
const ADDITIONAL_ROUTES = [
  // Ajoutez ici des routes qui ne seraient pas détectées automatiquement
];

/**
 * Fonction principale
 */
function generateRoutes() {
  console.log('🔍 Scan du dossier app/ pour détecter toutes les routes...\n');

  const routes = scanDirectory(APP_DIR);

  // Ajouter les routes additionnelles
  ADDITIONAL_ROUTES.forEach(route => routes.add(route));

  // Convertir en tableau et trier
  const routesArray = Array.from(routes).sort();

  // Créer le manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    total: routesArray.length,
    routes: routesArray,
  };

  // Sauvegarder
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`✅ ${routesArray.length} routes détectées et sauvegardées dans routes-manifest.json\n`);

  // Afficher un aperçu
  console.log('📋 Aperçu des routes détectées:');
  console.log('━'.repeat(60));

  // Grouper par module
  const grouped = {};
  routesArray.forEach(route => {
    const module = route.split('/')[1] || 'root';
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(route);
  });

  Object.keys(grouped).sort().forEach(module => {
    console.log(`\n📁 ${module} (${grouped[module].length} routes)`);
    grouped[module].slice(0, 5).forEach(route => {
      console.log(`   ${route}`);
    });
    if (grouped[module].length > 5) {
      console.log(`   ... et ${grouped[module].length - 5} autres`);
    }
  });

  console.log('\n━'.repeat(60));
  console.log(`\n💾 Fichier généré: ${OUTPUT_FILE}\n`);

  return routesArray.length;
}

// Exécuter
try {
  const count = generateRoutes();
  process.exit(0);
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
