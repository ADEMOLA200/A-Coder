/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useState, useRef } from 'react';

/**
 * Fade-in animation for messages
 */
export const FadeIn = ({ children, delay = 0, duration = 300 }: { children: React.ReactNode, delay?: number, duration?: number }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), delay);
		return () => clearTimeout(timer);
	}, [delay]);

	return (
		<div
			style={{
				opacity: isVisible ? 1 : 0,
				transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
				transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
			}}
		>
			{children}
		</div>
	);
};

/**
 * Slide-in from left animation (for user messages)
 */
export const SlideInLeft = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), delay);
		return () => clearTimeout(timer);
	}, [delay]);

	return (
		<div
			style={{
				opacity: isVisible ? 1 : 0,
				transform: isVisible ? 'translateX(0)' : 'translateX(-12px)',
				transition: 'opacity 250ms ease-out, transform 250ms ease-out',
			}}
		>
			{children}
		</div>
	);
};

/**
 * Slide-in from right animation (for assistant messages)
 */
export const SlideInRight = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), delay);
		return () => clearTimeout(timer);
	}, [delay]);

	return (
		<div
			style={{
				opacity: isVisible ? 1 : 0,
				transform: isVisible ? 'translateX(0)' : 'translateX(12px)',
				transition: 'opacity 250ms ease-out, transform 250ms ease-out',
			}}
		>
			{children}
		</div>
	);
};

/**
 * Enhanced typing indicator with shimmer text animation
 * Uses CSS text-shimmer class for GPU-accelerated effect
 */
export const TypingIndicator = ({
	state = 'thinking', // 'thinking' | 'processing' | 'generating'
}: {
	state?: 'thinking' | 'processing' | 'generating';
}) => {
	// Rotating loading messages
	const messagesByState: Record<'thinking' | 'processing' | 'generating', string[]> = {
		thinking: [
			'A-Coder is thinking',
			'A-Coder is planning the next steps',
			'A-Coder is looking over your code',
		],
		processing: [
			'A-Coder is processing your request',
			'A-Coder is working out the best way to tackle this',
			'A-Coder is checking context and tools',
		],
		generating: [
			'A-Coder is drafting a response',
			'A-Coder is putting the pieces together',
			'A-Coder is writing your answer',
		],
	};

	const allMessages = messagesByState[state] ?? messagesByState.thinking;
	const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * allMessages.length));

	// Advance message every few seconds
	useEffect(() => {
		const interval = window.setInterval(() => {
			setMessageIndex((prev) => (prev + 1) % allMessages.length);
		}, 4500);
		return () => window.clearInterval(interval);
	}, [allMessages.length]);

	const currentMessage = allMessages[messageIndex] || allMessages[0];

	return (
		<div className="py-2">
			<span className="text-sm select-none text-shimmer">
				{currentMessage}
			</span>
		</div>
	);
};

/**
 * ReAct phase indicator for showing Thought/Action/Observation phases
 */
export const ReActPhaseIndicator = ({
	phase,
	phaseContent
}: {
	phase?: 'thought' | 'action' | 'observation' | null;
	phaseContent?: string;
}) => {
	if (!phase) return null;

	const phaseConfig = {
		thought: {
			icon: '🧠',
			color: 'var(--vscode-charts-purple, #652d90)',
			bgColor: 'rgba(101, 45, 144, 0.1)',
			text: 'Thinking',
			description: 'A-Coder is reasoning about the next steps'
		},
		action: {
			icon: '⚡',
			color: 'var(--vscode-void-accent, #007acc)',
			bgColor: 'rgba(0, 122, 204, 0.1)',
			text: 'Taking Action',
			description: 'A-Coder is executing tools to complete the task'
		},
		observation: {
			icon: '👁️',
			color: 'var(--vscode-charts-green, #388a34)',
			bgColor: 'rgba(56, 138, 52, 0.1)',
			text: 'Observing Results',
			description: 'A-Coder is analyzing the tool execution results'
		}
	};

	const config = phaseConfig[phase];

	return (
		<div
			className="flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-300"
			style={{
				borderColor: config.color,
				backgroundColor: config.bgColor,
			}}
		>
			{/* Phase icon */}
			<span className="text-lg">{config.icon}</span>

			{/* Phase info */}
			<div className="flex-1">
				<div className="flex items-center gap-2">
					<span
						className="text-sm font-medium"
						style={{ color: config.color }}
					>
						{config.text}
					</span>
					{/* Thinking dots for thought phase */}
					{phase === 'thought' && (
						<div className="flex gap-1">
							<div
								className="w-1 h-1 rounded-full animate-pulse"
								style={{
									backgroundColor: config.color,
									animationDelay: '0s'
								}}
							/>
							<div
								className="w-1 h-1 rounded-full animate-pulse"
								style={{
									backgroundColor: config.color,
									animationDelay: '0.2s'
								}}
							/>
							<div
								className="w-1 h-1 rounded-full animate-pulse"
								style={{
									backgroundColor: config.color,
									animationDelay: '0.4s'
								}}
							/>
						</div>
					)}
					{/* Spinner for action phase */}
					{phase === 'action' && (
						<div
							className="w-3 h-3 border border-current rounded-full"
							style={{
								borderColor: config.color,
								borderTopColor: 'transparent',
								animation: 'spin 0.8s linear infinite',
							}}
						/>
					)}
				</div>

				{/* Phase description */}
				<div className="text-xs text-void-fg-4 mt-0.5">
					{config.description}
				</div>

				{/* Phase content if available */}
				{phaseContent && (
					<div className="text-xs text-void-fg-3 mt-1 italic truncate" title={phaseContent}>
						{phaseContent}
					</div>
				)}
			</div>
		</div>
	);
};

/**
 * Enhanced tool loading indicator with progress states and smooth transitions
 */
export const ToolLoadingIndicator = ({
	toolName,
	toolParams,
	stage = 'executing', // 'preparing' | 'executing' | 'completing'
	progress = undefined // 0-1 for tools with progress
}: {
	toolName?: string,
	toolParams?: any,
	stage?: 'preparing' | 'executing' | 'completing',
	progress?: number
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [prevStage, setPrevStage] = useState(stage);

	// Smooth stage transitions
	useEffect(() => {
		if (prevStage !== stage) {
			const timer = setTimeout(() => setPrevStage(stage), 150);
			return () => clearTimeout(timer);
		}
	}, [stage, prevStage]);

	// Extract file info for file-related tools
	const getFileInfo = () => {
		if (!toolParams) return null;

		if (toolName === 'edit_file' || toolName === 'rewrite_file') {
			const uri = toolParams.uri?.fsPath || toolParams.uri;
			if (uri) {
				const fileName = uri.split('/').pop() || uri;

				// Calculate diff stats for edit_file
				let diffStats = null;
				if (toolName === 'edit_file' && toolParams.searchReplaceBlocks) {
					let addedLines = 0;
					let removedLines = 0;
					const blocks = toolParams.searchReplaceBlocks.split('<<<<<<< ORIGINAL').slice(1);
					blocks.forEach((block: string) => {
						const parts = block.split('=======');
						if (parts.length === 2) {
							const original = parts[0].trim();
							const updated = parts[1].split('>>>>>>> UPDATED')[0].trim();
							removedLines += original ? original.split('\n').length : 0;
							addedLines += updated ? updated.split('\n').length : 0;
						}
					});
					if (addedLines > 0 || removedLines > 0) {
						diffStats = { addedLines, removedLines };
					}
				}

				return { type: 'file', path: uri, fileName, diffStats };
			}
		}

		if (toolName === 'read_file') {
			const uri = toolParams.uri?.fsPath || toolParams.uri;
			if (uri) {
				const fileName = uri.split('/').pop() || uri;
				const lineInfo = toolParams.startLine || toolParams.endLine
					? ` (lines ${toolParams.startLine || 1}-${toolParams.endLine || '∞'})`
					: '';
				return { type: 'file', path: uri, fileName, extra: lineInfo };
			}
		}

		return null;
	};

	const fileInfo = getFileInfo();
	const hasDetails = fileInfo !== null;

	// Stage-based styling
	const stageConfig = {
		preparing: {
			color: 'var(--vscode-charts-orange, #f38500)',
			text: 'Preparing...',
			spinSpeed: '1.2s'
		},
		executing: {
			color: 'var(--vscode-void-accent, #007acc)',
			text: 'Executing...',
			spinSpeed: '0.8s'
		},
		completing: {
			color: 'var(--vscode-charts-green, #388a34)',
			text: 'Completing...',
			spinSpeed: '0.6s'
		}
	};

	const currentConfig = stageConfig[stage];
	const isTransitioning = prevStage !== stage;

	return (
		<div className={`flex flex-col gap-1 py-2 ${isTransitioning ? 'transition-all duration-150' : ''}`}>
			<div className="flex items-center gap-2">
				{/* File name with diff stats for edit_file */}
				{fileInfo && fileInfo.fileName ? (
					<div className="flex items-center gap-1.5">
						<span className="text-void-fg-3 text-sm">{fileInfo.fileName}</span>
						{fileInfo.diffStats && (
							<span className='flex items-center gap-1 text-xs'>
								{fileInfo.diffStats.addedLines > 0 && (
									<span className='text-green-500'>+{fileInfo.diffStats.addedLines}</span>
								)}
								{fileInfo.diffStats.removedLines > 0 && (
									<span className='text-red-500'>-{fileInfo.diffStats.removedLines}</span>
								)}
							</span>
						)}
					</div>
				) : toolName ? (
					<span className="text-void-fg-3 text-sm">
						{toolName === 'detecting...' ? 'Detecting tool...' : toolName.replace(/_/g, ' ')}
					</span>
				) : null}

				{/* Enhanced spinner with stage-based styling */}
				<div className="relative">
					<div
						className="w-3 h-3 border-2 rounded-full transition-all duration-300"
						style={{
							borderColor: currentConfig.color,
							borderTopColor: 'transparent',
							animation: `spin ${currentConfig.spinSpeed} linear infinite`,
							opacity: stage === 'completing' ? 0.8 : 1
						}}
					/>
					{/* Progress indicator for tools with progress */}
					{progress !== undefined && (
						<div
							className="absolute inset-0 w-3 h-3 border-2 rounded-full"
							style={{
								borderColor: 'var(--vscode-input-background, #252526)',
								borderTopColor: currentConfig.color,
								transform: `rotate(${progress * 360}deg)`,
								transition: 'transform 0.3s ease-out'
							}}
						/>
					)}
				</div>

				{/* Stage text */}
				<span className="text-xs text-void-fg-4 italic">
					{currentConfig.text}
				</span>

				{/* Collapsible icon for file details */}
				{hasDetails && (
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="text-void-fg-4 hover:text-void-fg-2 transition-all duration-200 ml-1"
						aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							style={{
								transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
								transition: 'transform 200ms ease-in-out'
							}}
						>
							<path
								d="M3 4.5L6 7.5L9 4.5"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				)}
			</div>

			{/* Enhanced collapsible file details with animation */}
			<ExpandCollapse isExpanded={isExpanded}>
				{hasDetails && fileInfo && (
					<div className="text-xs text-void-fg-4 pl-5 py-1 font-mono border-l-2 border-void-border-3">
						<div className="flex items-center gap-1 mb-1">
							<span className="text-void-fg-3 font-medium">{fileInfo.fileName}</span>
							{fileInfo.extra && <span className="text-void-fg-5">{fileInfo.extra}</span>}
						</div>
						<div className="text-void-fg-5 truncate" title={fileInfo.path}>
							{fileInfo.path}
						</div>
						{progress !== undefined && (
							<div className="mt-1">
								<div className="w-full bg-void-bg-2 rounded-full h-1">
									<div
										className="h-1 rounded-full transition-all duration-300"
										style={{
											width: `${progress * 100}%`,
											backgroundColor: currentConfig.color
										}}
									/>
								</div>
							</div>
						)}
					</div>
				)}
			</ExpandCollapse>
		</div>
	);
};

/**
 * Expand/collapse animation for tool calls
 * Uses max-height for GPU-accelerated animation
 */
export const ExpandCollapse = ({ isExpanded, children }: { isExpanded: boolean, children: React.ReactNode }) => {
	return (
		<div
			style={{
				maxHeight: isExpanded ? '500px' : '0px',
				opacity: isExpanded ? 1 : 0,
				overflow: 'hidden',
				transition: 'max-height 200ms ease-out, opacity 150ms ease-out',
			}}
		>
			{children}
		</div>
	);
};

/**
 * Pulse animation for loading states
 */
export const Pulse = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="animate-pulse">
			{children}
		</div>
	);
};

/**
 * Shimmer effect for loading content
 */
export const Shimmer = ({ className = '' }: { className?: string }) => {
	return (
		<div className={`relative overflow-hidden bg-void-bg-2 rounded ${className}`}>
			<div
				className="absolute inset-0 -translate-x-full animate-shimmer"
				style={{
					background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
					animation: 'shimmer 2s infinite',
				}}
			/>
		</div>
	);
};

/**
 * Scale-in animation for buttons/actions
 */
export const ScaleIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), delay);
		return () => clearTimeout(timer);
	}, [delay]);

	return (
		<div
			style={{
				opacity: isVisible ? 1 : 0,
				transform: isVisible ? 'scale(1)' : 'scale(0.9)',
				transition: 'opacity 200ms ease-out, transform 200ms ease-out',
			}}
		>
			{children}
		</div>
	);
};

/**
 * Smooth state transition component for tool call states
 */
export const StateTransition = ({
	children,
	state,
	duration = 300
}: {
	children: React.ReactNode,
	state: string,
	duration?: number
}) => {
	const [currentState, setCurrentState] = useState(state);
	const [isTransitioning, setIsTransitioning] = useState(false);

	useEffect(() => {
		if (currentState !== state) {
			setIsTransitioning(true);
			const timer = setTimeout(() => {
				setCurrentState(state);
				setIsTransitioning(false);
			}, duration / 2);
			return () => clearTimeout(timer);
		}
	}, [state, currentState, duration]);

	return (
		<div
			style={{
				opacity: isTransitioning ? 0.7 : 1,
				transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
				transition: `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`,
			}}
		>
			{children}
		</div>
	);
};

/**
 * Staggered animation for multiple items
 */
export const StaggeredAnimation = ({
	children,
	staggerDelay = 100,
	initialDelay = 0
}: {
	children: React.ReactNode[],
	staggerDelay?: number,
	initialDelay?: number
}) => {
	return (
		<>
			{React.Children.map(children, (child, index) => (
				<FadeIn
					key={index}
					delay={initialDelay + (index * staggerDelay)}
					duration={250}
				>
					{child}
				</FadeIn>
			))}
		</>
	);
};

/**
 * Pulse-once animation for attention grabbing
 */
export const PulseOnce = ({ children, trigger }: { children: React.ReactNode, trigger: boolean }) => {
	const [shouldPulse, setShouldPulse] = useState(false);

	useEffect(() => {
		if (trigger) {
			setShouldPulse(true);
			const timer = setTimeout(() => setShouldPulse(false), 600);
			return () => clearTimeout(timer);
		}
	}, [trigger]);

	return (
		<div
			style={{
				transform: shouldPulse ? 'scale(1.05)' : 'scale(1)',
				transition: 'transform 300ms ease-out',
			}}
		>
			{children}
		</div>
	);
};

/**
 * Smooth height animation for content changes
 * Uses max-height for better performance (no layout measurements)
 */
export const SmoothHeight = ({ children, isVisible, maxHeight = '1000px' }: { children: React.ReactNode, isVisible: boolean, maxHeight?: string }) => {
	return (
		<div
			style={{
				maxHeight: isVisible ? maxHeight : '0px',
				opacity: isVisible ? 1 : 0,
				overflow: 'hidden',
				transition: 'max-height 250ms ease-out, opacity 200ms ease-out',
			}}
		>
			{children}
		</div>
	);
};
