# A-Coder UI Modernization Guide

## Design Audit Summary

After analyzing the codebase, here are the prioritized modernization opportunities for the sidebar chat UI, settings pages, and overall design system.

---

## 1. Typography System

### Current Issues
- **No custom font loaded** - Uses system defaults inherited from VS Code
- **Headlines lack presence** - Chat headers and settings titles use similar weights to body text
- **No font-variant-numeric for data** - Token counters and numbers use proportional spacing

### Recommendations

```css
/* Add to styles.css or create a typography.css */

/* Load a distinctive font - Geist, Outfit, or Satoshi are excellent choices */
@font-face {
	font-family: 'A-Coder';
	src: url('./fonts/A-Coder-Regular.woff2') format('woff2');
	font-weight: 400;
	font-display: swap;
}

@font-face {
	font-family: 'A-Coder';
	src: url('./fonts/A-Coder-Medium.woff2') format('woff2');
	font-weight: 500;
	font-display: swap;
}

@font-face {
	font-family: 'A-Coder';
	src: url('./fonts/A-Coder-SemiBold.woff2') format('woff2');
	font-weight: 600;
	font-display: swap;
}

:root {
	/* Typography Scale */
	--void-font-sans: 'A-Coder', system-ui, -apple-system, sans-serif;
	--void-font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;

	/* Text sizes with better hierarchy */
	--void-text-xs: 0.6875rem;    /* 11px - labels, badges */
	--void-text-sm: 0.8125rem;   /* 13px - body small */
	--void-text-base: 0.875rem;  /* 14px - body */
	--void-text-lg: 0.9375rem;  /* 15px - emphasized body */
	--void-text-xl: 1.125rem;   /* 18px - section headers */
	--void-text-2xl: 1.375rem; /* 22px - page titles */
	--void-text-3xl: 1.75rem;  /* 28px - hero/display */
}

.@@void-scope {
	font-family: var(--void-font-sans);
	font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}

/* Tabular numbers for data displays */
.void-tabular-nums {
	font-variant-numeric: tabular-nums;
	font-feature-settings: 'tnum' 1;
}

/* Headlines with presence */
.void-heading-display {
	font-size: var(--void-text-3xl);
	font-weight: 600;
	letter-spacing: -0.025em;
	line-height: 1.1;
}

.void-heading-section {
	font-size: var(--void-text-xl);
	font-weight: 600;
	letter-spacing: -0.015em;
	line-height: 1.3;
}

/* Balance text wrapping for better orphans */
.void-text-balance {
	text-wrap: balance;
}
```

**Apply to SidebarChat.tsx:**
```tsx
// Token counter should use tabular nums
<span className='font-mono void-tabular-nums'>{used.toLocaleString()}</span>
```

---

## 2. Color System Overhaul

### Current Issues
- **Purple/blue "AI gradient" aesthetic** - Heavy reliance on indigo/purple gradients (`#6366f1`)
- **Oversaturated accent colors** - The accent gradient is too vibrant for an IDE context
- **Generic box-shadow** - Using pure black opacity shadows instead of tinted
- **Flat design with zero texture** - Missing subtle depth indicators

### Recommendations

```css
/* Replace in styles.css - Refined color system */

& {
	/* Refined Backgrounds - Warmer, more sophisticated */
	--void-bg-1: var(--vscode-input-background);
	--void-bg-2: var(--vscode-sideBar-background);
	--void-bg-3: var(--vscode-editor-background);

	/* Use subtle warmth in dark backgrounds */
	--void-bg-elevated: color-mix(in srgb, var(--vscode-editor-background) 95%, oklch(0.7 0.02 270));
	--void-bg-overlay: color-mix(in srgb, var(--vscode-editor-background) 88%, oklch(0.5 0.03 250));

	/* Sophisticated accent - Muted teal/cyan for differentiation */
	--void-accent-primary: oklch(0.7 0.12 195);  /* Teal-ish */
	--void-accent-secondary: oklch(0.65 0.08 250); /* Subtle purple */

	/* Tinted shadows - Match the background hue */
	--void-shadow-sm: 0 1px 2px color-mix(in srgb, var(--vscode-editor-background) 80%, oklch(0.2 0.01 270));
	--void-shadow-md: 0 4px 12px color-mix(in srgb, var(--vscode-editor-background) 70%, oklch(0.15 0.02 270));
	--void-shadow-lg: 0 8px 24px color-mix(in srgb, var(--vscode-editor-background) 60%, oklch(0.1 0.02 270));

	/* Subtle accent glow - Less intense */
	--void-accent-glow: 0 0 16px color-mix(in srgb, var(--void-accent-primary) 20%, transparent);
}

/* Gradient buttons - More refined */
.void-btn-primary {
	background: linear-gradient(
		135deg,
		oklch(0.65 0.1 195) 0%,
		oklch(0.6 0.08 200) 100%
	);
}

.void-btn-primary:hover {
	background: linear-gradient(
		135deg,
		oklch(0.7 0.12 195) 0%,
		oklch(0.65 0.1 200) 100%
	);
}
```

---

## 3. Layout & Component Modernization

### Sidebar Chat Improvements

**Current Issues:**
- Uniform border-radius on all elements
- No visual depth hierarchy
- Message bubbles lack differentiation
- Task Plan component feels heavy

**Recommendations:**

```css
/* Variable border radius system */
:root {
	--void-radius-xs: 4px;   /* Badges, pills */
	--void-radius-sm: 8px;    /* Inputs, small buttons */
	--void-radius-md: 12px;   /* Cards, containers */
	--void-radius-lg: 16px;   /* Large panels */
	--void-radius-xl: 24px;   /* Hero elements */
	--void-radius-full: 9999px; /* Circular */
}

/* Message bubbles - More distinctive */
.message-user {
	border-radius: var(--void-radius-md) var(--void-radius-md) 4px var(--void-radius-md);
	background: linear-gradient(
		135deg,
		color-mix(in srgb, var(--void-accent-primary) 12%, var(--void-depth-elevated)) 0%,
		color-mix(in srgb, var(--void-accent-primary) 8%, var(--void-depth-elevated)) 100%
	);
	border-left: 2px solid var(--void-accent-primary);
	box-shadow: var(--void-shadow-sm);
}

.message-assistant {
	border-radius: var(--void-radius-md) 4px var(--void-radius-md) var(--void-radius-md);
	background: var(--void-depth-elevated);
	border: 1px solid color-mix(in srgb, var(--void-fg-1) 6%, transparent);
}

/* Tool cards - Layered depth */
.tool-card-premium {
	background: var(--void-depth-elevated);
	border-radius: var(--void-radius-md);
	border: 1px solid transparent;
	box-shadow: var(--void-shadow-sm);
	position: relative;
}

.tool-card-premium::before {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: inherit;
	padding: 1px;
	background: linear-gradient(
		180deg,
		color-mix(in srgb, var(--void-fg-1) 8%, transparent) 0%,
		transparent 100%
	);
	-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
	mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
	-webkit-mask-composite: xor;
	mask-composite: exclude;
	pointer-events: none;
}

/* Task Plan - Lighter, more organized */
.void-task-plan {
	border-radius: var(--void-radius-md);
	border: 1px solid var(--void-border-2);
	background: var(--void-depth-elevated);
}

.void-task-header {
	padding: 12px 16px;
	border-bottom: 1px solid var(--void-border-2);
	background: color-mix(in srgb, var(--void-accent-primary) 5%, transparent);
}

.void-task-item {
	padding: 12px 16px;
	border-bottom: 1px solid color-mix(in srgb, var(--void-border-2) 50%, transparent);
	transition: background-color 150ms ease-out;
}

.void-task-item:hover {
	background: var(--void-bg-2-hover);
}

.void-task-item:last-child {
	border-bottom: none;
}
```

---

## 4. Settings Page Redesign

### Current Issues
- Dense, wall-of-text layout
- Inconsistent spacing between sections
- Generic card styling
- No visual hierarchy for different setting types

### Recommendations

```tsx
// Settings.tsx - Modernized layout

const SettingsContainer = ({ children }: { children: React.ReactNode }) => (
	<div className="max-w-4xl mx-auto px-8 py-12">
		<div className="space-y-16">
			{children}
		</div>
	</div>
);

const SettingsSection = ({
	title,
	description,
	children,
	icon: Icon
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
	icon?: React.ComponentType<{ className?: string }>;
}) => (
	<section className="space-y-8">
		<div className="flex items-start gap-4">
			{Icon && (
				<div className="p-3 rounded-xl bg-void-accent/10 text-void-accent shrink-0">
					<Icon className="w-5 h-5" />
				</div>
			)}
			<div className="flex-1 min-w-0">
				<h2 className="text-lg font-semibold text-void-fg-1 tracking-tight">{title}</h2>
				{description && (
					<p className="text-sm text-void-fg-3 mt-1 leading-relaxed">{description}</p>
				)}
			</div>
		</div>
		<div className="pl-16 space-y-6">
			{children}
		</div>
	</section>
);

const SettingsCard = ({ children }: { children: React.ReactNode }) => (
	<div className="void-card p-6 space-y-4">
		{children}
	</div>
);

// Usage example:
<SettingsContainer>
	<SettingsSection
		title="Models"
		description="Configure AI model providers and preferences"
		icon={Cpu}
	>
		<SettingsCard>
			<SettingRow label="Default Model" description="Primary model for chat interactions">
				<ModelDropdown />
			</SettingRow>
		</SettingsCard>
	</SettingsSection>
</SettingsContainer>
```

### Settings CSS Enhancements

```css
/* Settings-specific styles */

.void-settings-nav {
	position: sticky;
	top: 0;
	background: color-mix(in srgb, var(--vscode-sideBar-background) 95%, transparent);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border-bottom: 1px solid var(--void-border-2);
	z-index: 100;
}

.void-settings-tab {
	padding: 10px 16px;
	font-size: 13px;
	font-weight: 500;
	color: var(--void-fg-3);
	border-radius: var(--void-radius-sm);
	transition: all 150ms ease-out;
	cursor: pointer;
}

.void-settings-tab:hover {
	color: var(--void-fg-1);
	background: var(--void-bg-2-hover);
}

.void-settings-tab[data-active="true"] {
	color: var(--void-accent-primary);
	background: color-mix(in srgb, var(--void-accent-primary) 10%, transparent);
}

/* Setting rows with better spacing */
.void-setting-row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 24px;
	align-items: start;
	padding: 16px 0;
	border-bottom: 1px solid color-mix(in srgb, var(--void-border-2) 30%, transparent);
}

.void-setting-row:last-child {
	border-bottom: none;
}

/* Toggle/Switch improvements */
.void-switch {
	position: relative;
	width: 44px;
	height: 24px;
	background: var(--void-bg-3);
	border-radius: var(--void-radius-full);
	transition: background-color 200ms ease-out;
	cursor: pointer;
}

.void-switch[data-checked="true"] {
	background: var(--void-accent-primary);
}

.void-switch-thumb {
	position: absolute;
	top: 2px;
	left: 2px;
	width: 20px;
	height: 20px;
	background: var(--void-fg-1);
	border-radius: var(--void-radius-full);
	transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
	box-shadow: var(--void-shadow-sm);
}

.void-switch[data-checked="true"] .void-switch-thumb {
	transform: translateX(20px);
}
```

---

## 5. Interaction States & Micro-interactions

### Current Issues
- Hover states exist but could be more refined
- Missing pressed/active states on many elements
- Focus rings inconsistent
- No loading skeleton states

### Recommendations

```css
/* Enhanced interaction states */

/* Buttons - Full state spectrum */
.void-btn {
	position: relative;
	overflow: hidden;
	transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.void-btn::after {
	content: '';
	position: absolute;
	inset: 0;
	background: currentColor;
	opacity: 0;
	transition: opacity 150ms ease-out;
}

.void-btn:hover {
	transform: translateY(-1px);
}

.void-btn:active::after {
	opacity: 0.1;
}

.void-btn:active {
	transform: scale(0.98) translateY(0);
	transition-duration: 50ms;
}

/* Focus-visible for accessibility */
.void-btn:focus-visible {
	outline: none;
	box-shadow: 0 0 0 2px var(--vscode-focusBorder), var(--void-accent-glow);
}

/* Cards with spotlight effect */
.void-card-interactive {
	position: relative;
	transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.void-card-interactive::before {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: inherit;
	opacity: 0;
	background: radial-gradient(
		600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
		color-mix(in srgb, var(--void-accent-primary) 15%, transparent),
		transparent 40%
	);
	transition: opacity 300ms ease-out;
	pointer-events: none;
}

.void-card-interactive:hover::before {
	opacity: 1;
}

/* Skeleton loading states */
.void-skeleton {
	background: linear-gradient(
		90deg,
		var(--void-bg-3) 0%,
		color-mix(in srgb, var(--void-fg-1) 5%, var(--void-bg-3)) 50%,
		var(--void-bg-3) 100%
	);
	background-size: 200% 100%;
	animation: skeleton-shimmer 1.5s ease-in-out infinite;
	border-radius: var(--void-radius-sm);
}

.void-skeleton-text {
	height: 1em;
	border-radius: var(--void-radius-xs);
}

.void-skeleton-heading {
	height: 1.5em;
	width: 60%;
	border-radius: var(--void-radius-xs);
}

.void-skeleton-avatar {
	width: 40px;
	height: 40px;
	border-radius: var(--void-radius-full);
}

@keyframes skeleton-shimmer {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

/* Staggered entry animations */
.void-stagger-container > * {
	opacity: 0;
	animation: void-stagger-fade-in 400ms ease-out forwards;
}

.void-stagger-container > *:nth-child(1) { animation-delay: 0ms; }
.void-stagger-container > *:nth-child(2) { animation-delay: 60ms; }
.void-stagger-container > *:nth-child(3) { animation-delay: 120ms; }
.void-stagger-container > *:nth-child(4) { animation-delay: 180ms; }
.void-stagger-container > *:nth-child(5) { animation-delay: 240ms; }
.void-stagger-container > *:nth-child(6) { animation-delay: 300ms; }
.void-stagger-container > *:nth-child(7) { animation-delay: 360ms; }
.void-stagger-container > *:nth-child(8) { animation-delay: 420ms; }

@keyframes void-stagger-fade-in {
	from {
		opacity: 0;
		transform: translateY(8px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
```

---

## 6. Sidebar Chat Specific Improvements

### Message Input Area

```css
/* Modernized input area */
.void-chat-input-container {
	position: relative;
	background: var(--void-depth-elevated);
	border-radius: var(--void-radius-lg);
	border: 1px solid var(--void-border-2);
	box-shadow: var(--void-shadow-sm);
	transition: border-color 200ms ease-out, box-shadow 200ms ease-out;
}

.void-chat-input-container:focus-within {
	border-color: color-mix(in srgb, var(--void-accent-primary) 50%, var(--void-border-1));
	box-shadow: var(--void-shadow-md), var(--void-accent-glow-subtle);
}

.void-chat-input {
	width: 100%;
	min-height: 60px;
	max-height: 200px;
	padding: 16px;
	padding-right: 100px; /* Space for send button */
	background: transparent;
	border: none;
	resize: none;
	font-size: var(--void-text-base);
	line-height: 1.5;
	color: var(--void-fg-1);
}

.void-chat-input::placeholder {
	color: var(--void-fg-3);
}

.void-chat-input:focus {
	outline: none;
}

.void-chat-actions {
	position: absolute;
	right: 12px;
	bottom: 12px;
	display: flex;
	align-items: center;
	gap: 8px;
}

.void-send-button {
	width: 36px;
	height: 36px;
	border-radius: var(--void-radius-sm);
	background: var(--void-accent-gradient);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}

.void-send-button:hover {
	transform: scale(1.05);
	box-shadow: var(--void-accent-glow);
}

.void-send-button:active {
	transform: scale(0.95);
}
```

### Thread Selector Enhancement

```tsx
// SidebarThreadSelector.tsx improvements

const ThreadListItem = ({ thread, isActive, onClick }: ThreadItemProps) => (
	<button
		onClick={onClick}
		className={`
			group relative w-full text-left p-4 rounded-xl transition-all duration-200
			${isActive
				? 'bg-void-accent/10 border border-void-accent/30'
				: 'hover:bg-void-bg-2-hover border border-transparent'
			}
		`}
	>
		<div className="flex items-start gap-3">
			{/* Avatar with subtle gradient */}
			<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-void-accent/20 to-void-accent/5 flex items-center justify-center shrink-0">
				<MessageSquare className="w-4 h-4 text-void-accent" />
			</div>

			<div className="flex-1 min-w-0">
				{/* Thread title - truncate gracefully */}
				<h3 className="text-sm font-medium text-void-fg-1 truncate void-text-balance">
					{thread.title || 'Untitled conversation'}
				</h3>

				{/* Metadata row */}
				<div className="flex items-center gap-2 mt-1">
					<span className="text-xs text-void-fg-4">
						{formatRelativeTime(thread.lastModified)}
					</span>
					<span className="text-void-fg-5">·</span>
					<span className="text-xs text-void-fg-4">
						{thread.messageCount} messages
					</span>
				</div>
			</div>

			{/* Hover actions */}
			<div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
				<button className="p-1.5 rounded-md hover:bg-void-bg-3">
					<Trash2 className="w-3.5 h-3.5 text-void-fg-4" />
				</button>
			</div>
		</div>

		{/* Active indicator */}
		{isActive && (
			<div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-void-accent rounded-full" />
		)}
	</button>
);
```

---

## 7. Empty & Error States

### Current Issues
- Basic error display
- Missing empty states for threads, search results
- No onboarding "getting started" view

### Recommendations

```tsx
// EmptyState.tsx
const EmptyThreadsState = ({ onCreateThread }: { onCreateThread: () => void }) => (
	<div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center">
		<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-void-accent/20 to-void-accent/5 flex items-center justify-center mb-6">
			<MessageSquare className="w-8 h-8 text-void-accent" />
		</div>

		<h3 className="text-lg font-semibold text-void-fg-1 mb-2">
			No conversations yet
		</h3>
		<p className="text-sm text-void-fg-3 max-w-xs mb-6">
			Start a new conversation to begin chatting with A-Coder. Ask questions, write code, or explore ideas.
		</p>

		<button
			onClick={onCreateThread}
			className="void-btn-primary px-5 py-2.5 flex items-center gap-2"
		>
			<Plus className="w-4 h-4" />
			<span>New conversation</span>
		</button>
	</div>
);

const SearchEmptyState = ({ query }: { query: string }) => (
	<div className="flex flex-col items-center justify-center py-12 text-center">
		<div className="w-16 h-16 rounded-xl bg-void-bg-2 flex items-center justify-center mb-4">
			<Search className="w-6 h-6 text-void-fg-4" />
		</div>
		<p className="text-sm text-void-fg-3">
			No results for <span className="text-void-fg-1 font-medium">"{query}"</span>
		</p>
		<p className="text-xs text-void-fg-4 mt-1">
			Try different keywords or check spelling
		</p>
	</div>
);

const ErrorState = ({ error, onRetry }: { error: Error; onRetry?: () => void }) => (
	<div className="flex flex-col items-center justify-center py-12 text-center">
		<div className="w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
			<AlertTriangle className="w-6 h-6 text-red-400" />
		</div>
		<h3 className="text-sm font-medium text-void-fg-1 mb-1">Something went wrong</h3>
		<p className="text-xs text-void-fg-3 max-w-xs">{error.message}</p>
		{onRetry && (
			<button onClick={onRetry} className="mt-4 text-sm text-void-accent hover:underline">
				Try again
			</button>
		)}
	</div>
);
```

---

## 8. Loading & Skeleton States

```tsx
// LoadingSkeleton.tsx
const MessageSkeleton = () => (
	<div className="flex gap-4 p-4 animate-pulse">
		{/* Avatar skeleton */}
		<div className="w-10 h-10 rounded-lg void-skeleton" />

		<div className="flex-1 space-y-3">
			{/* Content lines */}
			<div className="h-4 w-3/4 void-skeleton void-skeleton-text" />
			<div className="h-4 w-1/2 void-skeleton void-skeleton-text" />
			<div className="h-4 w-5/6 void-skeleton void-skeleton-text" />
		</div>
	</div>
);

const SettingsSkeleton = () => (
	<div className="space-y-8">
		{/* Section header */}
		<div className="space-y-4">
			<div className="h-6 w-48 void-skeleton void-skeleton-heading" />
			<div className="h-4 w-96 void-skeleton void-skeleton-text" />
		</div>

		{/* Settings cards */}
		{[1, 2, 3].map(i => (
			<div key={i} className="void-card p-6 space-y-4">
				<div className="h-4 w-32 void-skeleton void-skeleton-text" />
				<div className="h-10 w-full void-skeleton" />
			</div>
		))}
	</div>
);
```

---

## 9. Accessibility Improvements

```css
/* Skip link for keyboard navigation */
.void-skip-link {
	position: absolute;
	top: -40px;
	left: 0;
	background: var(--void-accent-primary);
	color: white;
	padding: 8px 16px;
	z-index: 1000;
	transition: top 150ms ease-out;
}

.void-skip-link:focus {
	top: 0;
}

/* High contrast focus indicators */
.void-focus-visible:focus-visible {
	outline: 2px solid var(--vscode-focusBorder);
	outline-offset: 2px;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
	* {
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
	}
}

/* Screen reader only text */
.void-sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

/* Focus trap for modals */
.void-focus-trap:focus {
	outline: none;
}
```

---

## 10. Implementation Priority

Apply changes in this order for maximum visual impact with minimum risk:

1. **Color System** - Update CSS variables for backgrounds, shadows, and accents
2. **Typography** - Add custom font, establish hierarchy, tabular numbers
3. **Border Radius System** - Implement variable radii
4. **Button States** - Add active/pressed states, improve hover
5. **Message Bubbles** - Refine borders, padding, and visual distinction
6. **Settings Layout** - Implement new section/card structure
7. **Loading States** - Add skeleton components
8. **Empty States** - Add composed "getting started" views
9. **Micro-interactions** - Spotlight cards, staggered animations
10. **Accessibility** - Focus management, skip links, motion preferences

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `styles.css` | Typography scale, color variables, animations, border radius system |
| `SidebarChat.tsx` | Message styling, input area, loading states |
| `Settings.tsx` | Layout restructure, section components |
| `inputs.tsx` | Input styling, switch animations |
| `components.tsx` | Card, button, and interaction utilities |
| `ToolResultHelpers.tsx` | Tool card styling |
| `SidebarThreadSelector.tsx` | Thread list item styling |

---

## Quick Wins (Immediate Application)

These changes can be applied immediately with minimal risk:

```css
/* Add to existing styles.css */

/* 1. Better text balance */
.void-text-balance {
	text-wrap: balance;
}

/* 2. Tabular numbers for data */
.void-tabular-nums {
	font-variant-numeric: tabular-nums;
}

/* 3. Refined shadows */
:root {
	--void-shadow-sm: 0 1px 2px oklch(0.15 0.01 270 / 8%);
	--void-shadow-md: 0 4px 12px oklch(0.15 0.01 270 / 12%);
	--void-shadow-lg: 0 8px 24px oklch(0.15 0.01 270 / 16%);
}

/* 4. Active button state */
.void-btn-primary:active {
	transform: scale(0.98);
	transition-duration: 50ms;
}

/* 5. Better focus ring */
.void-focus-visible:focus-visible {
	outline: 2px solid var(--vscode-focusBorder);
	outline-offset: 2px;
	box-shadow: var(--void-accent-glow-subtle);
}

/* 6. Staggered animations */
.void-stagger > * {
	opacity: 0;
	animation: void-fade-up 400ms ease-out forwards;
}

@keyframes void-fade-up {
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: translateY(0); }
}
```