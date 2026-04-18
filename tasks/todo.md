# Plan de refactoring - Loura Frontend

## État actuel

**Branche**: `feature/refactoring`
**Date**: 2026-04-18

## Objectifs du refactoring

- [ ] Améliorer la maintenabilité et la lisibilité
- [ ] Réduire la duplication de code
- [ ] Séparer logique métier et UI
- [ ] Améliorer la gestion du state
- [ ] Faciliter la scalabilité

## Phases

### Phase 1: Audit ✅
- [x] Analyser la structure existante
- [x] Identifier les problèmes
- [x] Documenter l'architecture actuelle

### Phase 2: Architecture cible 🚧
- [ ] Définir les couches (UI, Hooks, Services, State)
- [ ] Créer les conventions de nommage
- [ ] Documenter les patterns à suivre

### Phase 3: Refactoring par module
- [ ] Module HR - Employees (exemple pilote)
- [ ] Module HR - Contracts
- [ ] Module HR - Payroll
- [ ] Module Inventory - Products
- [ ] Module Inventory - Sales
- [ ] (autres modules...)

### Phase 4: Optimisations
- [ ] Performance (memo, useMemo, useCallback)
- [ ] Lazy loading
- [ ] Server/Client Components

### Phase 5: Qualité
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Documentation

## Règles strictes

❌ **Ne jamais**:
- Casser le comportement existant
- Modifier les routes
- Changer l'intégration backend
- Refaire toute l'app d'un coup

✅ **Toujours**:
- Tester visuellement et fonctionnellement
- Garder le même rendu UI
- Refactoring incrémental
- Documenter les changements
