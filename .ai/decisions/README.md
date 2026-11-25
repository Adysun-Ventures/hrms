# Architectural Decision Records (ADRs)

This directory contains records of all significant architectural decisions made for the Statement Builder project.

## Decision Index

| ADR ID | Title | Date | Status | Impact Area |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | [Multi-Bank Statement Architecture](file:///home/sugat/Downloads/viraj%20kadam/BankStatement/.ai/decisions/ADR-001-multi-bank-architecture.md) | 2026-11-13 | **ACCEPTED** | Data Model, PDF Routing, UI Selectors |
| **ADR-002** | [Dual-Runtime React-PDF Rendering](file:///home/sugat/Downloads/viraj%20kadam/BankStatement/.ai/decisions/ADR-002-react-pdf-dual-rendering.md) | 2026-11-12 | **ACCEPTED** | PDF Generation, CLI Scripts, Vite |
| **ADR-003** | [Integer Paise Balance Calculation](file:///home/sugat/Downloads/viraj%20kadam/BankStatement/.ai/decisions/ADR-003-integer-paise-arithmetic.md) | 2026-11-12 | **ACCEPTED** | Core Math, CSV Import, Validation |
| **ADR-004** | [Client-Side PDF Password Encryption](file:///home/sugat/Downloads/viraj%20kadam/BankStatement/.ai/decisions/ADR-004-pdf-password-encryption.md) | 2026-11-14 | **ACCEPTED** | PDF Generation, Security, Download |
| **ADR-005** | [PDF Preview Virtualization & Seeder Simplification](file:///home/sugat/Documents/vk/viraj%20kadam/BankStatement/.ai/decisions/ADR-005-pdf-preview-virtualization-and-seeder-simplification.md) | 2026-11-16 | **ACCEPTED** | PDF Preview, Performance, Seeder UI |
| **ADR-006** | [Worker Isolation & Storage Quota Resilience](ADR-006-worker-isolation-and-storage-resilience.md) | 2026-11-16 | **ACCEPTED** | Threading, Firefox Compliance, Storage |
| **ADR-007** | [Smart Filler Data & Gap Seeding](ADR-007-smart-filler-data-and-gap-seeding.md) | 2026-11-17 | **ACCEPTED** | Seeder Engine, Realism |
| **ADR-008** | [Single-Line Date & Reference Formatting](ADR-008-single-line-date-and-ref-formatting.md) | 2026-11-17 | **ACCEPTED** | PDF Typography, Layout |
| **ADR-009** | [Reusable Datepicker Component](ADR-009-reusable-datepicker-component.md) | 2026-11-18 | **ACCEPTED** | UI Components, Date Handling |
| **ADR-010** | [Penultimate Summary & Final Regulatory Pages](ADR-010-penultimate-summary-and-final-regulatory-pages.md) | 2026-11-18 | **ACCEPTED** | Multi-page PDF Structure |
| **ADR-011** | [Kotak Statement Fidelity Alignment](ADR-011-kotak-fidelity-fonts-colors-metadata-and-table-geometry.md) | 2026-11-19 | **ACCEPTED** | Typography, Colors, Table Geometry |
| **ADR-012** | [CSS Scoping, Specificity Isolation & CardHeader Geometry](ADR-012-css-scoping-specificity-and-header-geometry.md) | 2026-11-20 | **ACCEPTED** | UI Integration, CSS Isolation, Specificity |

---

## Allowed Statuses

- `PROPOSED`: Under review; not yet active in code.
- `ACCEPTED`: Approved, implemented, and actively enforced.
- `REJECTED`: Declined alternative with rationale (see `.ai/history/rejected/`).
- `EXPERIMENTAL`: Under trial or benchmark (see `.ai/history/experiments/`).
- `SUPERSEDED`: Replaced by a newer approved ADR (see `.ai/history/superseded/`).
- `DEPRECATED`: Still operational but scheduled for phase-out.
- `BLOCKED`: Awaiting external resolution.

*Rule: Never silently delete or alter an ADR. To update an accepted decision, create a new ADR that supersedes the former.*
