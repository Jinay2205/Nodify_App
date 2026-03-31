# Nodify Design System

## Overview
Nodify is a high-tech personal relationship intelligence application with an ultra-dark, sophisticated aesthetic inspired by terminal screens and premium SaaS applications.

## Color Palette

### Background Colors
- **Background Dark**: `#09090B` (bg-zinc-950)
- **Surface Dark**: `#18181B` (bg-zinc-900)
- **Surface Elevated**: `#27272A` (bg-zinc-800)

### Text Colors
- **Text High Contrast**: `#FAFAFA` (text-white)
- **Text Low Contrast**: `#A1A1AA` (text-zinc-400)
- **Text Subtle**: `#71717A` (text-zinc-500)

### Accent Colors
- **Accent Neon Green**: `#4ADE80` (primary actions, highlights)
- **Accent Green Dark**: `#22C55E` (hover states)
- **Accent Blue**: `#3B82F6` (secondary accents)

### Status Colors
- **Warm**: `#F59E0B` (amber-500) - Strong relationships
- **Cool**: `#3B82F6` (blue-500) - Needs reconnection
- **Neutral**: `#71717A` (zinc-500) - Moderate engagement

## Typography

### Font Families
- **Body/UI**: Inter (sans-serif)
- **Data/Code**: JetBrains Mono (monospace)

### Usage
- Headers, buttons, labels → Inter
- Dates, metrics, status indicators, relationship logs → JetBrains Mono

## Core Components

### StatusBadge
Displays relationship warmth level with color-coded indicators:
- Cool (Blue)
- Neutral (Gray)
- Warm (Amber)

### Tag
Selectable tag component with neon green glow when selected.
Used for specializations and interests.

### CategoryCard
Icon-based selection cards for onboarding.
Features subtle border glow on selection.

### MonoText
Wrapper component that applies monospace font styling.

## Key UI Patterns

### Borderless Inputs
- Background: `#18181B`
- Border: `#27272A` (zinc-800)
- Focus ring: `#4ADE80` (neon green)

### Primary Buttons
- Background: `#4ADE80`
- Hover: `#22C55E`
- Text: Black

### Outline Buttons
- Background: Transparent
- Border: `#27272A`
- Text: White
- Hover Background: `#18181B`

### Data Tables
- Row hover: `#18181B/50`
- Border: `#27272A`
- Monospace for data cells

## Screen Layouts

### 1. Onboarding
- Centered form with progress indicators
- Multi-step flow with card-based selection
- Neon green accents on selected states

### 2. Dashboard
- Persistent sidebar navigation
- Prominent search bar
- At-a-glance panels with warmth visualization
- Data table with monospace formatting

### 3. Connection Detail
- Two-column split (30/70)
- Profile sidebar with warmth gauge
- Timeline-based interaction log
- AI suggestion generator panel

## Animation & Effects

### Glow Effects
Selected elements use box-shadow with neon green:
```css
shadow-[0_0_12px_rgba(74,222,128,0.2)]
```

### Transitions
All interactive elements use smooth transitions:
```css
transition-all
```

## Best Practices

1. **Contrast**: Always use high-contrast text (#FAFAFA) on dark backgrounds
2. **Monospace**: Use for dates, metrics, and data points
3. **Spacing**: Maintain generous padding (6-8) for breathing room
4. **Borders**: Keep borders subtle with zinc-800
5. **Highlights**: Use neon green sparingly for emphasis
6. **Intelligence Feel**: Embrace terminal-like aesthetics with monospace and structured data displays
