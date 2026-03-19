/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useRef, useState, useMemo } from 'react';

// Mermaid type definitions
interface MermaidAPI {
	initialize: (config: object) => void;
	render: (id: string, text: string) => Promise<{ svg: string; bindFunctions?: (element: HTMLElement) => void }>;
}

// Cache for the mermaid library
let mermaidInstance: MermaidAPI | null = null;
let mermaidLoadPromise: Promise<MermaidAPI | null> | null = null;
let mermaidInitialized = false;
let loadAttempted = false;

// Counter for unique diagram IDs
let diagramCounter = 0;
const getUniqueDiagramId = () => {
	diagramCounter += 1;
	return `mermaid-diagram-${diagramCounter}-${Date.now()}`;
};

// Check if mermaid is already available on window
const getMermaidFromWindow = (): MermaidAPI | null => {
	if (typeof window !== 'undefined' && (window as any).mermaid) {
		return (window as any).mermaid;
	}
	return null;
};

// Load mermaid from CDN
const loadMermaidFromCDN = (): Promise<MermaidAPI | null> => {
	return new Promise((resolve) => {
		// Check if already loaded on window
		const windowMermaid = getMermaidFromWindow();
		if (windowMermaid) {
			resolve(windowMermaid);
			return;
		}

		// Don't try loading more than once
		if (loadAttempted) {
			resolve(null);
			return;
		}
		loadAttempted = true;

		// Try to inject script element to load mermaid
		const script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.13.0/dist/mermaid.min.js';
		script.async = true;

		const cleanup = () => {
			script.removeEventListener('load', onLoad);
			script.removeEventListener('error', onError);
		};

		const onLoad = () => {
			cleanup();
			const m = getMermaidFromWindow();
			resolve(m);
		};

		const onError = () => {
			cleanup();
			console.warn('Mermaid could not be loaded from CDN. Diagrams will not render.');
			resolve(null);
		};

		script.addEventListener('load', onLoad);
		script.addEventListener('error', onError);

		try {
			document.head.appendChild(script);
		} catch (e) {
			// Trusted Types or CSP may block this
			console.warn('Mermaid loading blocked by security policy. Diagrams will not render.');
			cleanup();
			resolve(null);
		}
	});
};

// Get or load mermaid
const getMermaid = async (): Promise<MermaidAPI | null> => {
	if (mermaidInstance) {
		return mermaidInstance;
	}

	if (mermaidLoadPromise) {
		return mermaidLoadPromise;
	}

	mermaidLoadPromise = loadMermaidFromCDN();
	const mermaid = await mermaidLoadPromise;
	if (mermaid) {
		mermaidInstance = mermaid;
	}
	return mermaidInstance;
};

// Initialize mermaid with theme
const initMermaid = async (isDark: boolean = true): Promise<MermaidAPI | null> => {
	const mermaid = await getMermaid();

	if (!mermaid) {
		return null;
	}

	if (!mermaidInitialized) {
		mermaid.initialize({
			startOnLoad: false,
			theme: isDark ? 'dark' : 'default',
			securityLevel: 'loose',
			flowchart: {
				useMaxWidth: true,
				htmlLabels: true,
				curve: 'basis',
			},
			sequence: {
				useMaxWidth: true,
				wrap: true,
			},
			gantt: {
				useMaxWidth: true,
			},
		});
		mermaidInitialized = true;
	}

	return mermaid;
};

export interface MermaidRenderProps {
	diagram: string;
	className?: string;
	isDark?: boolean;
}

/**
 * Renders Mermaid diagrams from text definitions.
 * Supports flowcharts, sequence diagrams, class diagrams, state diagrams, gantt charts, etc.
 *
 * Note: Mermaid is loaded from CDN when needed. If blocked by security policy
 * (e.g., VS Code's Trusted Types), a fallback message is shown.
 */
export const MermaidRender: React.FC<MermaidRenderProps> = ({
	diagram,
	className = '',
	isDark = true,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [svgContent, setSvgContent] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Generate unique ID for this diagram instance
	const diagramId = useMemo(() => getUniqueDiagramId(), []);

	// Render diagram
	useEffect(() => {
		let cancelled = false;

		const renderDiagram = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Clean up diagram string - remove leading/trailing whitespace
				const cleanDiagram = diagram.trim();

				// Validate that the diagram has content
				if (!cleanDiagram) {
					throw new Error('Empty diagram definition');
				}

				// Initialize and get mermaid instance
				const mermaid = await initMermaid(isDark);

				if (cancelled) return;

				if (!mermaid) {
					// Mermaid not available - show code block instead
					setError('Mermaid diagrams require an internet connection to load. This diagram cannot be rendered in your current environment.');
					return;
				}

				// Render using mermaid API
				const { svg } = await mermaid.render(diagramId, cleanDiagram);

				if (cancelled) return;

				setSvgContent(svg);
			} catch (err) {
				if (cancelled) return;
				console.error('Mermaid rendering error:', err);
				const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
				setError(errorMessage);
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		renderDiagram();

		return () => {
			cancelled = true;
		};
	}, [diagram, diagramId, isDark]);

	// Render to DOM
	useEffect(() => {
		if (containerRef.current && svgContent) {
			containerRef.current.innerHTML = svgContent;
		}
	}, [svgContent]);

	if (isLoading) {
		return (
			<div className={`mermaid-container my-4 p-4 bg-void-bg-2 rounded-lg border border-void-border-2 ${className}`}>
				<div className="flex items-center gap-2 text-void-fg-3">
					<div className="animate-spin w-4 h-4 border-2 border-void-fg-3 border-t-transparent rounded-full" />
					<span className="text-sm">Loading diagram...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={`mermaid-fallback my-4 border border-void-border-2 rounded-lg overflow-hidden ${className}`}>
				<div className="px-3 py-2 bg-void-bg-2 border-b border-void-border-2 flex items-center gap-2">
					<span className="text-xs text-void-fg-3 font-medium">Mermaid Diagram</span>
				</div>
				<div className="p-4 bg-void-bg-1">
					{error === 'Mermaid diagrams require an internet connection to load. This diagram cannot be rendered in your current environment.' ? (
						<div className="text-void-fg-3 text-sm">
							<p className="mb-2">Diagram rendering unavailable in this environment.</p>
							<details className="text-xs">
								<summary className="cursor-pointer text-void-fg-4 hover:text-void-fg-2">View diagram source</summary>
								<pre className="mt-2 p-2 bg-void-bg-2 rounded overflow-x-auto text-void-fg-2">{diagram}</pre>
							</details>
						</div>
					) : (
						<div className="text-red-400 text-sm">
							<p className="mb-2">{error}</p>
							<details className="text-xs">
								<summary className="cursor-pointer text-void-fg-4 hover:text-void-fg-2">View diagram source</summary>
								<pre className="mt-2 p-2 bg-void-bg-2 rounded overflow-x-auto text-void-fg-2">{diagram}</pre>
							</details>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={`mermaid-container my-4 p-4 bg-void-bg-2 rounded-lg border border-void-border-2 overflow-x-auto ${className}`}
			style={{ minHeight: '50px' }}
		/>
	);
};

/**
 * Checks if a string looks like a mermaid diagram definition
 * Used for auto-detection in markdown code blocks
 */
export const isMermaidDiagram = (code: string, language: string | undefined): boolean => {
	// Explicit mermaid language
	if (language === 'mermaid' || language === 'mmd') {
		return true;
	}

	// Auto-detect common mermaid diagram types
	const trimmedCode = code.trim().toLowerCase();
	const mermaidKeywords = [
		'flowchart',
		'graph',
		'sequencediagram',
		'classdiagram',
		'statediagram',
		'gantt',
		'pie',
		'erdiagram',
		'journey',
		'gitgraph',
		'mindmap',
		'timeline',
		'quadrantchart',
		'requirement',
	];

	// Check if starts with a mermaid keyword
	return mermaidKeywords.some(keyword => {
		// Match patterns like "flowchart TD", "graph TB", etc.
		const pattern = new RegExp(`^${keyword}\\b`, 'i');
		return pattern.test(trimmedCode);
	});
};

export default MermaidRender;