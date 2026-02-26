#!/usr/bin/env node

/**
 * Script de migration automatique des status badges
 * Remplace les imports de BadgeStatus.tsx par les nouveaux composants consolidés
 */

const fs = require('fs');
const path = require('path');

const filesToMigrate = [
  'app/apps/(org)/[slug]/hr/payroll/page.tsx',
  'app/apps/(org)/[slug]/inventory/sales/[id]/page.tsx',
  'app/apps/(org)/[slug]/inventory/credit-sales/page.tsx',
  'app/apps/(org)/[slug]/hr/leaves/[id]/page.tsx',
  'app/apps/(org)/[slug]/inventory/stock-counts/[id]/page.tsx',
  'app/apps/(org)/[slug]/inventory/stock-counts/page.tsx',
  'app/apps/(org)/[slug]/inventory/orders/page.tsx',
  'app/apps/(org)/[slug]/inventory/suppliers/[id]/page.tsx',
  'app/apps/(org)/[slug]/hr/payroll/advances/page.tsx',
  'app/apps/(org)/[slug]/hr/employees/[id]/payroll/page.tsx',
  'app/apps/(org)/[slug]/hr/attendance/history/page.tsx',
  'app/apps/(org)/[slug]/inventory/documents/proformas/page.tsx',
];

// Mappings de fonctions vers composants
const functionToComponentMap = {
  getStatusBadgeNode: {
    payroll: 'PayrollStatusBadge',
    leave: 'LeaveStatusBadge',
    order: 'OrderStatusBadge',
    payment: 'PaymentStatusBadge',
    attendance: 'AttendanceStatusBadge',
  }
};

function migrateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  // Remplacer l'import de BadgeStatus
  if (content.includes('from "@/lib/utils/BadgeStatus"')) {
    // Déterminer quels composants sont nécessaires basé sur le contenu
    const needsPayroll = content.includes('payroll') || content.includes('Payroll');
    const needsLeave = content.includes('leave') || content.includes('Leave') || content.includes('congé');
    const needsOrder = content.includes('order') || content.includes('Order') || content.includes('commande');
    const needsPayment = content.includes('payment') || content.includes('Payment') || content.includes('credit');
    const needsAttendance = content.includes('attendance') || content.includes('Attendance') || content.includes('présence');

    const components = [];
    if (needsPayroll) components.push('PayrollStatusBadge');
    if (needsLeave) components.push('LeaveStatusBadge');
    if (needsOrder) components.push('OrderStatusBadge');
    if (needsPayment) components.push('PaymentStatusBadge');
    if (needsAttendance) components.push('AttendanceStatusBadge');

    if (components.length > 0) {
      // Remplacer l'import
      const oldImportPattern = /import\s*\{[^}]*\}\s*from\s*"@\/lib\/utils\/BadgeStatus";?/;
      const newImport = `import { ${components.join(', ')} } from "@/components/common";`;

      content = content.replace(oldImportPattern, newImport);
      modified = true;
    }
  }

  // Remplacer les usages de getStatusBadgeNode
  const getStatusBadgeNodePattern = /getStatusBadgeNode\(([^)]+)\)/g;
  content = content.replace(getStatusBadgeNodePattern, (match, statusArg) => {
    // Déterminer le type de badge basé sur le contexte
    const lowerContent = content.toLowerCase();

    let component = 'PayrollStatusBadge'; // Défaut

    if (lowerContent.includes('payroll') && statusArg.includes('payroll')) {
      component = 'PayrollStatusBadge';
    } else if (lowerContent.includes('leave') || lowerContent.includes('congé')) {
      component = 'LeaveStatusBadge';
    } else if (lowerContent.includes('order') || lowerContent.includes('commande')) {
      component = 'OrderStatusBadge';
    } else if (lowerContent.includes('attendance') || lowerContent.includes('présence')) {
      component = 'AttendanceStatusBadge';
    } else if (lowerContent.includes('payment') || lowerContent.includes('credit')) {
      component = 'PaymentStatusBadge';
    }

    modified = true;
    return `<${component} status={${statusArg}} showIcon />`;
  });

  // Remplacer getStatusIcon et getStatusVariant par le composant approprié
  if (content.includes('getStatusIcon') || content.includes('getStatusVariant')) {
    console.log(`⚠️  ${filePath} utilise getStatusIcon/getStatusVariant - migration manuelle nécessaire`);
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Migré: ${filePath}`);
  } else {
    console.log(`⏭️  Ignoré (déjà migré ou aucun changement): ${filePath}`);
  }
}

console.log('🚀 Début de la migration des status badges...\n');

filesToMigrate.forEach(file => {
  try {
    migrateFile(file);
  } catch (error) {
    console.error(`❌ Erreur lors de la migration de ${file}:`, error.message);
  }
});

console.log('\n✨ Migration terminée !');
console.log('\n📝 Prochaines étapes:');
console.log('1. Vérifier les fichiers migrés');
console.log('2. Tester l\'application');
console.log('3. Supprimer lib/utils/BadgeStatus.tsx et components/hr/status-badge.tsx');
