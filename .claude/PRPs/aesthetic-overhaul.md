# PRP: Modern Aesthetic Overhaul (v3.1)

## Objective
Transform the application's visual identity into a premium, modern, and highly interactive experience that "WOWs" the user.

## Proposed Changes

### 1. Typography
- **Headings**: `Outfit` (Modern, geometric, professional).
- **Body**: `Inter` (Highly readable, clean).

### 2. Color Palette (Premium Indigo & Emerald)
- **Primary**: Indigo-600 to Violet-700 gradient.
- **Surface**: Ultra-refined glassmorphism with better blur (24px) and subtle borders.
- **Background**: Dynamic mesh gradients (subtle) for light/dark modes.

### 3. Components Redesign
- **Sidebar**: Floating glass effect with active-state indicators.
- **Cards**: "Soft-lift" effect on hover with sophisticated shadows.
- **Buttons**: Premium gradients with micro-interactions (press-scale).
- **Inputs**: Solid background with focused glow effects.

### 4. Animations
- **Transitions**: Smooth slide-up for page content.
- **Skeleton Loads**: Shimmer effect for better perceived performance.
- **Feedback**: Pulse effects for critical alerts.

## Implementation Plan
1. Update `layout.tsx` with Google Fonts.
2. Overhaul `globals.css` with new design system tokens.
3. Update `AppLayout.tsx` and `Sidebar.tsx` for the new layout style.
4. Refine shared components (`Button`, `Card`) if they exist as separate files, or through global classes.
