# Repository Review: Asclepius (WhiteDevil-93/Ai-studio-HJH-App)

_Review date: 2026-07-27_

## Overview

Asclepius is a client-side clinical reference prototype for high-acuity Emergency
Department and ICU workflows. It integrates a curated subset of the Helen Joseph
Tertiary Hospital (HJH) Emergency Department Clinical Guidelines (January 2026,
247 pages) with ICU dosing material primarily from Chris Hani Baragwanath
Academic Hospital (CHBAH/Bara), plus selected content from Charlotte Maxeke
Johannesburg Academic Hospital (CMJAH) and South African Essential Drugs List /
Primary Health Care guidelines.

The application prioritises provenance tracking, clinical safety controls, dose
and infusion calculators, interactive scoring tools, resuscitation mind maps, and
hospital policies. It is explicitly positioned as a validation prototype and is
**not approved for independent clinical decision-making**.

**Tech stack**: Vite 6 + React 19 + TypeScript, Tailwind CSS 4, Vitest, Motion
(animations), Lucide icons. Fully client-side; no backend or external API keys
required. Includes PWA scaffolding (manifest, service worker, install prompt).

**Repository metrics** (at time of review): Private/early-stage appearance
(0 stars/forks), ~17 commits on `main`, Apache-2.0 for application code
(clinical content remains subject to source-owner rights).

## Strengths

### 1. Clinical Safety and Governance (Exemplary)

- Explicit, repeated disclaimers that the tool is under clinical validation.
- Source fingerprinting via SHA-256 hashes in
  `clinical-sources/source-manifest.json`.
- Formal errata register (`clinical-sources/errata.json`) that is
  release-blocking. Conflicting values (e.g., corrected sodium on pages 92 vs
  97, propofol concentration, ketamine/phenylephrine table arithmetic) are
  retained as separate labelled entries rather than silently resolved.
- Two-person clinical review requirement for any change to doses, units,
  contraindications, or management steps.
- Calculators require explicit user confirmation of prepared concentration
  and never assume weight or concentration.
- Structured warnings with severity levels (`information` / `caution` /
  `critical`).
- Validation script (`scripts/validate-clinical-data.ts`) enforces presence of
  metadata, non-empty titles, management steps for protocols, and blocks
  approved status for unresolved provenance.

### 2. Domain-Specific Functionality

- Weight-based dose extraction that preserves ranges, units, and maximum
  doses.
- Comprehensive infusion rate engine supporting multiple unit systems
  (`mcg/kg/min`, `mg/kg/hr`, etc.) with working equations displayed.
- Interactive clinical scores: GCS, NEXUS, Canadian C-Spine Rule, Alvarado,
  Wells DVT/PE, PERC, CURB-65, Burch-Wartofsky, and others.
- Facility-specific views (HJH-verified, Bara ICU card, CMJAH, SA EDL/PHC).
- Disease–drug bidirectional pairings, Code Red resuscitation drawer,
  interactive mind maps, and policy viewers.
- Local persistence of theme, weight, favourites, and recently viewed items.

### 3. Engineering Practices

- Clear separation of clinical types (`src/clinical/types.ts`), calculation
  modules with unit tests, and source registry.
- `npm run check` aggregates type-checking, data validation, tests, and
  production build.
- GitHub Actions workflow for clinical checks on push/PR.
- Sensible Vite configuration for GitHub Pages deployment (base path
  handling).
- Legacy-to-structured adapter that annotates entries with stable IDs, source
  references, review state, and source group labels.

## Areas Requiring Attention

### 1. Architecture and Maintainability (Primary Technical Debt)

`src/App.tsx` is extremely large (approximately 144 KB). It contains nearly
all rendering logic, state management, score calculators, infusion widgets,
category filtering, and navigation. This monolithic structure will impede
testing, refactoring, and collaborative development. Component extraction has
begun (`HomePage`, `MindMapViewer`, `PolicyViewer`, `CodeRedDrawer`,
`PWAInstallPrompt`) but remains incomplete.

### 2. Data Layer Maturity

Content still largely resides in the legacy `src/data.json` structure. The
`legacyAdapter` performs annotation and re-organisation at runtime. Full
migration to the typed `ClinicalEntry` model (with stable IDs, review status,
and transformation classification) is pending. Several entries still lack
exact page-level provenance.

### 3. Source Completeness

- RMMCH paediatric protocols are referenced by the HJH source but not yet
  supplied.
- Full CHBAH ICU dosing card requires a review copy.
- CMJAH content is an initial batch only.
- Distribution permissions for the primary HJH PDF remain unconfirmed
  (correctly excluded from the repository).

### 4. PWA Status

The README states the application is not currently a Progressive Web App and
offers no offline freshness guarantee. However, the repository already
contains `public/manifest.json`, `public/sw.js`, install prompt logic, and a
PWA asset generation script. This creates a minor documentation
inconsistency.

### 5. Testing and Release Readiness

Unit tests cover calculation formulas, infusions, weight-dose extraction,
scores, and the legacy adapter. The README correctly requires approved golden
tests for every enabled calculator before clinical release. Coverage of the
large UI surface remains limited, which is expected at the prototype stage.

### 6. Performance and Scalability Considerations

All clinical content loads client-side. On lower-end devices or with further
content expansion, initial load time and memory usage may become noticeable.
Search is currently simple string matching.

## Recommendations

1. **Refactor `App.tsx`** into focused modules: score calculators, infusion
   widgets, protocol/procedure cards, category rendering, and navigation state
   (consider custom hooks or a lightweight state library if complexity
   continues to grow).
2. **Complete the data migration** so that `data.json` becomes a pure source
   of truth that is transformed once into the typed clinical model at build or
   load time.
3. **Expand golden tests** for every calculator and critical pathway,
   especially those flagged in `errata.json`.
4. **Clarify PWA posture** in the README and decide whether offline caching
   of clinical content is desired (with appropriate versioning and freshness
   controls).
5. **Document the clinical review workflow** more formally (e.g., required
   fields for a pull request that touches clinical content).
6. Continue the existing disciplined approach to unresolved discrepancies —
   do not suppress or silently choose between conflicting values.

## Overall Assessment

Asclepius demonstrates unusually high standards of clinical governance and
provenance tracking for a prototype medical reference tool. The attention to
source integrity, errata management, calculation safety, and local South
African tertiary-hospital context (HJH, Bara, CMJAH, EDL) is a clear strength.

The principal engineering limitation is the size and complexity of the main
application component, together with the incomplete transition from legacy
data. These are addressable through systematic refactoring and do not
undermine the clinical design quality.

With continued clinical validation, provenance resolution, and
modularisation, the repository has strong potential as a practical bedside
reference for the intended high-acuity environments.
