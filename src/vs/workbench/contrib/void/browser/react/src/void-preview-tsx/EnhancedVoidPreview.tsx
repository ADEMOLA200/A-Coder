/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useCallback } from 'react';
import { Code, Eye, X, Check, BookOpen, AlertCircle } from 'lucide-react';
import '../styles.css';
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js';
import { useAccessor, useIsDark } from '../util/services.js';
import { registerPreviewTab } from '../sidebar-tsx/WalkthroughResultWrapper.js';

// Re-export original types
export type { VoidPreviewProps } from './VoidPreview.js';

export interface EnhancedVoidPreviewProps {
	title: string;
	content: string;
	isImplementationPlan?: boolean;
	isWalkthrough?: boolean;
	planId?: string;
	threadId?: string;
}

// Loading spinner component (shared)
const LoadingSpinner: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
	<svg
		className={`animate-spin ${className}`}
		fill="none"
		viewBox="0 0 24 24"
		aria-label="Loading"
	>
		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
	</svg>
);

/**
 * EnhancedVoidPreview - For walkthroughs and implementation plans
 * Uses VS Code design tokens (void-*) for theme compatibility
 *
 * Accessibility:
 * - All interactive elements have 44px min touch targets
 * - Visible focus indicators with ring-2 offset
 * - ARIA labels for screen readers
 * - Skip-to-content link for keyboard navigation
 * - Error states with live regions
 * - Semantic error styling (no hard-coded red)
 */
export const EnhancedVoidPreview: React.FC<EnhancedVoidPreviewProps> = ({
	title,
	content,
	isImplementationPlan,
	isWalkthrough,
	planId,
	threadId,
}) => {
	const isDark = useIsDark();
	const accessor = useAccessor();
	const chatThreadsService = accessor.get('IChatThreadService');
	const voidSettingsService = accessor.get('IVoidSettingsService');

	// Content state for walkthrough refreshes
	const [localContent, setLocalContent] = useState(content);

	// Action button states
	const [isApproving, setIsApproving] = useState(false);
	const [isRequestingChanges, setIsRequestingChanges] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Update local content when props change
	useEffect(() => {
		setLocalContent(content);
	}, [content]);

	// Register preview tab for auto-refresh
	useEffect(() => {
		if (!isWalkthrough || !planId || !threadId) return;

		const refreshFn = (filePath: string, newPreview: string) => {
			if (filePath === planId) {
				setLocalContent(newPreview);
			}
		};

		const cleanup = registerPreviewTab(planId, threadId, refreshFn);
		return () => cleanup();
	}, [isWalkthrough, planId, threadId]);

	// Auto-clear errors
	useEffect(() => {
		if (error) {
			const timeout = setTimeout(() => setError(null), 5000);
			return () => clearTimeout(timeout);
		}
	}, [error]);

	// ============================================
	// Action Handlers
	// ============================================

	const handleApprove = useCallback(async () => {
		if (!planId || !threadId || isApproving) return;

		setIsApproving(true);
		setError(null);

		try {
			voidSettingsService?.setGlobalSetting?.('chatMode', 'code');

			const message = isImplementationPlan
				? `The implementation plan (ID: ${planId}) has been approved for execution.

**Instructions:**
1. Use the \`create_plan\` tool to create a task plan based on the approved steps
2. Execute each task in order, tracking progress with \`update_task_status\`
3. Read files, make changes, and verify each step
4. Mark tasks complete as you finish

Begin execution now.`
				: `The walkthrough (File: ${planId}) has been approved. Proceed with the described changes.`;

			await chatThreadsService.addUserMessageAndStreamResponse({ threadId, userMessage: message });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send approval');
			console.error('Approval failed:', err);
		} finally {
			setIsApproving(false);
		}
	}, [planId, threadId, isApproving, isImplementationPlan, voidSettingsService, chatThreadsService]);

	const handleRequestChanges = useCallback(async () => {
		if (!planId || !threadId || isRequestingChanges) return;

		setIsRequestingChanges(true);
		setError(null);

		try {
			await voidSettingsService?.setGlobalSetting?.('chatMode', 'plan');

			const message = isImplementationPlan
				? `I request changes to the implementation plan (ID: ${planId}).\n\nRevise the plan based on my feedback, then use \`preview_implementation_plan\` to show updates.\n\nMy requested changes:`
				: `I request changes to the walkthrough (File: ${planId}).\n\nRevise based on my feedback.\n\nMy requested changes:`;

			await chatThreadsService.addUserMessageAndStreamResponse({ threadId, userMessage: message });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to request changes');
			console.error('Request changes failed:', err);
		} finally {
			setIsRequestingChanges(false);
		}
	}, [planId, threadId, isRequestingChanges, isImplementationPlan, voidSettingsService, chatThreadsService]);

	const handleReject = useCallback(async () => {
		if (!planId || !threadId || isRejecting) return;

		setIsRejecting(true);
		setError(null);

		try {
			const message = isImplementationPlan
				? `I reject the implementation plan (ID: ${planId}). Stop working on this plan.`
				: `I reject the walkthrough (File: ${planId}). Stop working on this.`;

			await chatThreadsService.addUserMessageAndStreamResponse({ threadId, userMessage: message });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to reject');
			console.error('Reject failed:', err);
		} finally {
			setIsRejecting(false);
		}
	}, [planId, threadId, isRejecting, isImplementationPlan, chatThreadsService]);

	// Derived state
	const showActions = (isImplementationPlan || isWalkthrough) && planId && threadId;
	const contentType = isImplementationPlan ? { icon: Code, label: 'Implementation Plan' }
		: isWalkthrough ? { icon: Eye, label: 'Code Walkthrough' }
		: { icon: BookOpen, label: 'Document' };
	const ContentIcon = contentType.icon;

	// Common button styles
	const buttonBase = 'min-h-[44px] flex items-center gap-2 rounded-lg font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50';

	return (
		<div className={`@@void-scope ${isDark ? 'dark' : ''}`} style={{ height: '100%', width: '100%' }}>
			<div className="h-full flex flex-col bg-void-bg-3 text-void-fg-1 overflow-hidden font-sans">

				{/* Skip to content - focuses main element for keyboard users */}
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-void-accent focus:text-white focus:rounded-lg focus:no-underline"
					onClick={(e) => {
						e.preventDefault();
						document.getElementById('main-content')?.focus();
					}}
				>
					Skip to content
				</a>

				{/* Header - compact spacing for related elements */}
				<header className="flex-shrink-0 flex items-center justify-between border-b border-void-border-2 bg-void-bg-2 px-4 py-3">
					<div className="flex items-center gap-3 min-w-0">
						<div className="flex-shrink-0 w-9 h-9 rounded-lg bg-void-accent/10 flex items-center justify-center">
							<ContentIcon size={18} className="text-void-accent" aria-hidden="true" />
						</div>
						<div className="flex flex-col gap-0.5 min-w-0">
							<h1 className="text-sm font-semibold text-void-fg-1 truncate">{title}</h1>
							{planId && (
								<span className="text-xs text-void-fg-4/70 font-mono truncate" title={planId}>
									{planId.split('/').pop()}
								</span>
							)}
						</div>
					</div>
				</header>

				{/* Error Banner - uses semantic error styling */}
				{error && (
					<div
						className="flex items-center gap-2 px-4 py-3 bg-void-accent/5 border-b border-void-accent/20"
						role="alert"
						aria-live="polite"
					>
						<AlertCircle size={16} className="text-void-accent flex-shrink-0" aria-hidden="true" />
						<span className="text-sm text-void-fg-1">{error}</span>
					</div>
				)}

				{/* Content */}
				<div className="flex-1 overflow-hidden flex">
					<main id="main-content" className="flex-1 overflow-y-auto custom-scrollbar" tabIndex={-1}>
						<article className="max-w-3xl mx-auto px-6 py-8 md:px-12">
							<div className="bg-void-bg-1 border border-void-border-2 rounded-lg shadow-sm overflow-hidden">
								<div className="p-6 md:p-10">
									<div className="prose prose-invert max-w-none
										prose-headings:text-void-fg-1 prose-headings:font-semibold prose-headings:tracking-tight
										prose-h1:text-2xl prose-h1:mb-6
										prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-void-border-2
										prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
										prose-p:text-void-fg-2 prose-p:leading-relaxed prose-p:text-sm prose-p:mb-4
										prose-li:text-void-fg-2 prose-li:mb-1.5 prose-li:text-sm
										prose-strong:text-void-fg-1 prose-strong:font-semibold
										prose-code:text-void-accent prose-code:bg-void-accent/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-xs
										prose-pre:bg-void-bg-4 prose-pre:border prose-pre:border-void-border-2 prose-pre:rounded-lg prose-pre:shadow-inner prose-pre:my-4
										prose-blockquote:border-l-4 prose-blockquote:border-void-accent prose-blockquote:bg-void-accent/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-void-fg-2 prose-blockquote:text-sm prose-blockquote:my-6
										prose-img:rounded-lg prose-img:shadow-md
										prose-table:border-collapse prose-th:bg-void-bg-2 prose-th:text-void-fg-1 prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-void-border-2 prose-th:text-sm prose-th:font-medium
										prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-void-border-2 prose-td:text-sm
									">
										<ChatMarkdownRender
											string={localContent}
											chatMessageLocation={undefined}
											isApplyEnabled={false}
											isLinkDetectionEnabled={true}
										/>
									</div>
								</div>
							</div>
							<div className="h-24" />
						</article>
					</main>
				</div>

				{/* Action Bar - visual hierarchy: primary (Approve) > secondary (Request Changes) > destructive (Reject) */}
				{showActions && (
					<div className="flex-shrink-0 border-t border-void-border-2 bg-void-bg-2 px-4 py-3">
						<div className="flex items-center justify-end gap-2">
							{/* Destructive action - text link style, lowest visual weight */}
							<button
								onClick={handleReject}
								disabled={isRejecting}
								aria-label="Reject this plan"
								className="min-h-[44px] px-3 py-2 text-sm text-void-fg-4 hover:text-red-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 focus-visible:ring-offset-void-bg-2 disabled:opacity-50 disabled:no-underline transition-colors"
							>
								{isRejecting ? <LoadingSpinner className="h-4 w-4" /> : 'Reject'}
							</button>

							{/* Secondary action - ghost style */}
							<button
								onClick={handleRequestChanges}
								disabled={isRequestingChanges}
								aria-label="Request changes to this plan"
								className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-void-fg-2 border border-void-border-3 rounded-lg hover:bg-void-bg-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-void-accent focus-visible:ring-offset-void-bg-2 disabled:opacity-50 transition-colors"
							>
								{isRequestingChanges ? <LoadingSpinner className="h-4 w-4" /> : 'Request Changes'}
							</button>

							{/* Primary action - filled style, highest visual weight */}
							<button
								onClick={handleApprove}
								disabled={isApproving}
								aria-label={isImplementationPlan ? 'Approve and execute this plan' : 'Approve this plan'}
								className="min-h-[44px] px-5 py-2.5 text-sm font-medium text-white bg-void-accent rounded-lg hover:opacity-90 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-void-accent focus-visible:ring-offset-void-bg-2 disabled:opacity-50 active:scale-[0.98] transition-all"
							>
								{isApproving ? <LoadingSpinner className="h-4 w-4" /> : (
									<span className="flex items-center gap-1.5">
										<Check size={16} aria-hidden="true" />
										{isImplementationPlan ? 'Approve & Execute' : 'Approve'}
									</span>
								)}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default EnhancedVoidPreview;