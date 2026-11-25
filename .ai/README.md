# AI Knowledge & Engineering Memory System (`.ai/`)

Welcome to the internal engineering memory and decision ledger of the **Statement Builder** project.

This directory is an authoritative, living knowledge base designed so that any AI agent session—regardless of context compaction or new conversations—immediately understands the project context, architectural decisions, rejected avenues, coding standards, and past lessons.

---

## Directory Overview

```
.ai/
├── README.md                  # This file
│
├── knowledge/                 # Core domain and system knowledge
│   ├── PROJECT_CONTEXT.md     # Project mission, features, supported banks
│   ├── ARCHITECTURE.md        # Technical architecture, stack, rendering flow
│   ├── DOMAIN_GLOSSARY.md     # Indian banking terminology, formats, standards
│   └── SYSTEM_INVARIANTS.md   # Non-negotiable system rules & mathematical truths
│
├── decisions/                 # Architecture Decision Records (ADRs)
│   ├── README.md              # ADR index with current lifecycle status
│   ├── ADR-001-multi-bank-architecture.md
│   ├── ADR-002-react-pdf-dual-rendering.md
│   └── ADR-003-integer-paise-arithmetic.md
│
├── history/                   # Historical record of decision outcomes
│   ├── accepted/              # Active accepted decisions
│   ├── rejected/              # Explicitly rejected alternatives (WHY + reconsider criteria)
│   ├── experiments/           # Benchmark/spike results (successes and failures)
│   └── superseded/            # Historical decisions replaced by newer ADRs
│
├── features/                  # Granular feature documentation
│   ├── multi-bank-support/    # Dynamic bank switching (Kotak, HDFC, etc.)
│   ├── hdfc-statement-replica/# Pixel-perfect HDFC PDF replica
│   └── dynamic-transaction-seeder/ # Dynamic Indian transaction generator
│       ├── SPEC.md
│       ├── PLAN.md
│       └── STATUS.md
│
├── standards/                 # Team and AI development standards
│   ├── CODING_STANDARDS.md    # React, CSS, and JS conventions
│   ├── TESTING_RULES.md       # Node native test runner rules & test cases
│   ├── SECURITY_RULES.md      # Sanitization, CSV formula injection defense
│   ├── GIT_WORKFLOW.md        # Commit messaging and branch hygiene
│   └── API_CONVENTIONS.md     # Statement JSON data models & normalization
│
├── lessons/                   # Compounded institutional memory
│   ├── BUGS_AND_ROOT_CAUSES.md# Deep post-mortems of hard-to-find bugs
│   ├── COMMON_MISTAKES.md     # Gotchas to avoid in this specific stack
│   └── TECHNICAL_DEBT.md      # Deliberate shortcuts and future improvements
│
└── templates/                 # Reusable templates for maintaining this system
    ├── DECISION_TEMPLATE.md
    ├── EXPERIMENT_TEMPLATE.md
    └── HANDOFF_TEMPLATE.md
```

---

## Operating Rules for AI Agents

1. **Check Before Proposing**: Never propose an approach listed under `.ai/history/rejected/`.
2. **Never Delete History**: Historical decisions and rejected ideas must never be deleted. If requirements change, link the new decision to the old one.
3. **Keep Features Updated**: Every feature touched during a session must have its `STATUS.md` updated.
4. **Log Tough Bugs**: When a non-trivial bug is diagnosed and resolved, append an entry to `.ai/lessons/BUGS_AND_ROOT_CAUSES.md`.
