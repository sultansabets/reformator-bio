

# BioPulse — Premium Health Management App

A mobile-first, premium health intelligence interface that goes beyond fitness tracking into state management. Think Whoop × Apple Health × Oura × Tesla UI.

---

## Design System Foundation

- **Color palette**: Deep teal/calm green primary accent, neutral grays, semantic status colors (green/yellow/red)
- **Typography**: Inter font family with strong hierarchy — large display numbers, medium labels, small body text
- **Spacing**: 8px grid system with generous whitespace throughout
- **Components**: Soft-shadow cards, pill buttons, minimal icons (Lucide), subtle dividers
- **Modes**: Full light and dark theme support with seamless toggle
- **Mobile feel**: Bottom tab bar, full-width cards, touch-friendly tap targets

---

## Screen 1: Control Center (Home)

**Hero Section**
- Large readiness score (0–100) with a clean circular ring indicator
- Color-coded ring: green (optimal), amber (moderate), red (recovery needed)
- One-line AI summary: *"Your body is well-recovered. Push harder today."*

**Why Panel**
- Three horizontal cards showing key factors: Sleep Quality, Strain Level, Lab Insights
- Each with an icon, value, and one-line explanation
- Subtle color coding matching their status

**Action Panel**
- "Today's Focus" section with 2–3 smart recommendation cards
- Actionable CTAs like "Start Morning Routine" or "Hydrate More"

**Quick Metrics Strip**
- Horizontal scrollable row: Heart Rate, Sleep Duration, Activity Load, Stress Level
- Live-style pulse animation on heart rate
- Compact card format with icon + value + label

---

## Screen 2: Insights

**Time Toggle**
- Clean pill-style toggle: Daily / Weekly / Monthly

**Trend Sections**
- **Sleep Trends**: Minimal bar/area chart showing sleep duration and quality over time
- **Load Trends**: Line chart for strain/activity load
- **Recovery History**: Smooth curve showing readiness score trend
- **Lab Insights Summary**: Key biomarker trend cards

**Chart Style**
- Recharts-powered, minimal axes, soft gradient fills, no grid clutter
- Focus on readability over data density

---

## Screen 3: Lab Insights (Sub-screen accessible from Insights & Control)

**Biomarker List**
- Clean card per biomarker: Vitamin D, Iron, Cortisol, Testosterone, etc.
- Each card shows: Name, current value, status indicator (colored dot/badge), simple plain-language explanation
- "Impacts" tags: Energy, Recovery, Stress
- Tappable for expanded detail view

**Disclaimer Footer**
- Subtle micro-text: *"Informational insights only. Not a medical diagnosis."*

---

## Screen 4: Store

**Visually Distinct Section**
- Slightly different background tone to feel like a separate commerce experience
- Clean header: "Recommended for You" based on insights

**Product Cards**
- Minimal product image placeholder
- Product name + short benefit line (*"Supports deep sleep & recovery"*)
- Price in KZT format: `12 500 ₸`
- CTA button: "Add to Cart" or "Support Recovery"

**Layout**
- 2-column grid on mobile
- Category filters at top (Recovery, Energy, Sleep, Immunity)

---

## Screen 5: Profile

- User avatar, name, and membership status
- **Goals section**: Daily targets for sleep, activity, recovery
- **Connected Devices**: List of paired wearables with status
- **Preferences**: Notification settings, units, language
- **Settings**: Theme toggle (light/dark), account, help
- Clean list-style layout with chevron navigation

---

## Bottom Tab Navigation

Four tabs with minimal icons and labels:
1. **Control** (Home icon) — main dashboard
2. **Insights** (Chart icon) — analytics & trends
3. **Store** (Shopping bag icon) — supplements
4. **Profile** (User icon) — settings & preferences

Active state: teal accent color; inactive: muted gray

---

## Overall Feel

The entire app will be built with a mobile-first viewport in mind (390×844), using a consistent component library of cards, buttons, charts, and navigation patterns. Every screen prioritizes calm clarity over information overload — making complex health data feel simple, premium, and trustworthy.

