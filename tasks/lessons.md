# Lessons Learned

## 2026-04-18 | Audit de refactoring

### Observations initiales

- L'application contient **99 pages** et **163 composants**
- Architecture modulaire existante (core, hr, inventory)
- Hooks génériques bien conçus mais sous-utilisés
- Duplication massive de logique dans les pages
- Mélange de logique métier et UI

### Leçons pour le refactoring

1. **Ne pas tout refaire** - L'architecture de base est bonne
2. **Utiliser les hooks existants** - useListData et useEntityForm sont excellents
3. **Refactoring progressif** - Un module à la fois
4. **Tester avant/après** - Garantir l'isomorphie fonctionnelle
