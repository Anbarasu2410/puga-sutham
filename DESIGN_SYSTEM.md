# DESIGN_SYSTEM.md — Puga Sutham

## Direction
Clear, calm, alert-focused — this is a monitoring tool people glance at quickly, not a marketing site. Prioritize legibility of the alert state over decoration.

## Colors
```
--background: #F8FAFC
--text: #0F172A
--primary: #0369A1      /* calm blue — normal state, map accents */
--alert: #DC2626        /* red — active drift-risk banner only */
--warning: #D97706       /* amber — moderate/uncertain risk */
--success: #16A34A       /* green — no active risk */
--surface: #FFFFFF
```

## Typography
Font: Inter (system-ui fallback)
H1: 28px / 36px / Bold — dashboard title
H2: 20px / 28px / Semibold — section headers
Body: 15px / 22px / Regular
Alert banner text: 16px / Semibold — must be readable at a glance on a phone

## Spacing
8px system: 8, 16, 24, 32, 48

## Components (via shadcn/ui)
- Alert banner: full-width, colored by risk level (green/amber/red), shows estimated arrival time when active
- Map card: Leaflet map, full width on mobile, fixed height ~400px
- Reading chart: Recharts line chart, last 24–48 hours of readings
- Photo upload card: large tap target for mobile camera access, shows classification result immediately

## States
- Loading: skeleton placeholders for map and chart while first fetch resolves
- Empty: "No active fires detected nearby" shown in the success-green state, not left blank
- Error/stale: "Data last updated X minutes ago" shown instead of a blank error page if FIRMS/Open-Meteo fetch fails (per API.md's fallback rule)

## Responsive Rules
Mobile: < 640px — single column, map above chart, large touch targets (villager/officer field use)
Desktop: > 1024px — map and alert side by side, chart below (conservator's office use)

## Accessibility
- Alert banner color is never the only signal — always paired with text ("HIGH RISK — smoke drift detected") not just a red background.
- All interactive elements (upload button, map controls) meet a minimum 44px touch target.
