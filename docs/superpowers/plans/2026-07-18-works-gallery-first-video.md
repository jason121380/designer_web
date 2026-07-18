# Works Gallery First Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make the leftmost mobile work video the deterministic default player.

**Architecture:** `WorksGallery` owns horizontal selection below 768px and passes `autoActivate` to `PublicVideo`. Desktop and other sections keep the existing independent viewport observer.

**Tech Stack:** React 19, Next.js 15, TypeScript, Node assertions via `tsx`

## Global Constraints

- Mobile selection requires at least 70% horizontal visibility.
- Equal ratios select the lower index.
- Desktop retains the existing 15% observer threshold.
- Preserve lazy loading, manual playback, and one active video.

### Task 1: Regression tests

**Files:** `tests/public-video-performance.test.ts`

- [x] Assert `autoActivate: false` suppresses automatic activation.
- [x] Assert `[1, 0.2]` selects index 0.
- [x] Assert `[1, 1, 0.2]` selects index 0.
- [x] Assert `[0.15, 1, 1]` selects index 1.
- [x] Assert ratios below 0.7 do not change selection.
- [x] Verify mobile selection, category reset, and responsive remount are wired.

Focused command:

```bash
node --import tsx tests/public-video-performance.test.ts
```

### Task 2: Controlled player activation

**Files:** `components/public/PublicVideo.tsx`

- [x] Add optional `autoActivate?: boolean` with default `true`.
- [x] Require it in `videoVisibilityAction` and the legacy WebView fallback.
- [x] Deactivate when it changes to `false`, without blocking later manual clicks.

### Task 3: Deterministic mobile gallery

**Files:** `components/public/WorksGallery.tsx`

- [x] Add pure `galleryActiveIndex(visibleRatios, minimumRatio = 0.7)`.
- [x] Track `activeIndex` and the `(max-width: 767px)` layout.
- [x] Calculate horizontal visible ratios during carousel scroll.
- [x] Allow only the selected mobile card to auto-activate.
- [x] Reset category changes to index 0 and horizontal position 0.
- [x] Remount players when rotation crosses the responsive breakpoint.

### Task 4: Verification and publication

- [x] Run focused and full tests.
- [x] Run `npx tsc --noEmit --incremental false`.
- [x] Run `npm run build:verify`.
- [ ] Commit, push `main`, fetch, and verify local/remote tree equality.
