# Adventist Pulse — Data Policy

## Rule: Ingest Everything, Ask Nothing

When Kyle sends data files, I:
1. **Parse immediately** — extract all rows, all years, all columns
2. **Save to master JSON** — append to `adventist-statistics-org.json` (or entity-specific files)
3. **Wire into prototype** — if the data fits an existing view, add it live
4. **Commit and push** — no drafts, no "should I?"
5. **Acknowledge with a summary** — what was added, key numbers

## File Structure

```
data/
├── adventist-statistics-org.json    # Master: all conferences/unions from adventiststatistics.org
├── nzp-conferences.json             # NZP conference-level data (NNZC, SNZC)
├── SNSW-MASTER-DATA.json            # SNSW Session Book extraction
├── attendance-nov*.csv              # SNSW attendance data
├── raw/                             # Original files as received (renamed clearly)
│   ├── Stats_AUC_2024.xls
│   ├── Stats_NZP_2024.xls
│   ├── Stats_PNGUM_2024.xls
│   ├── Stats_TPUM_2024.xls
│   ├── Stats_NNZC_2024.xls
│   ├── Stats_SNZC_2024.xls
│   └── ...
└── DATA-POLICY.md                   # This file
```

## Data Hierarchy

```
GC
└── SPD (division)
    ├── AUC (union) — 9 AU conferences ✅
    ├── NZP (union) — NNZC, SNZC ✅
    ├── PNGUM (union) — conferences TBD
    └── TPUM (union) — conferences TBD
```

## What Gets Stored

- **Every year** of data, not just latest — historical depth is the product's value
- **Every column** from adventiststatistics.org — even if not displayed yet
- **Raw files preserved** in `data/raw/` — never modify originals

## Historical Data — Full Depth
- **Always fetch from 1900** — the scraper URL uses `StartYear=1900` by default
- Every year matters, not just recent decades — the product's value is historical depth
- adventiststatistics.org has data back to 1863 for some entities

## Entity Merges, Splits & Reorganisations
- Conferences merge, split, and rename throughout SDA history
- The scraper runs **anomaly detection** on every entity after download
- Anomalies saved to `data/anomalies.json` with type: `likely_merge`, `likely_split`, `extreme_change`, `gap`
- **How we handle it:**
  - Beginning Membership ≠ prior Ending Membership → flag as merge/split
  - Growth >30% in a single year → flag as extreme_change
  - Missing years → flag as gap
  - Anomalies are displayed in the UI with tooltips (future: visual markers on trend charts)
  - The `RELATIONSHIP` table in the architecture tracks `successor_of` links between merged entities
- **Known reorganisations in our data:**
  - NZ conferences: 1925, 1964, 1967 — major restructures
  - PNG: 1972 (+40%), 2024 (+47.4%) — both legit growth, not merges
  - SPD 2024: +31.5% — driven by PNG baptisms

## What Triggers an Update

- Kyle sends a file → parse, save, wire, push
- Kyle mentions new data source → research, extract, save, wire, push
- Heartbeat finds new public data → save, wire, push (notify Kyle)
