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
 * Enhanced typing indicator with smooth wave animation and contextual states
 */
export const TypingIndicator = ({
	state = 'thinking', // 'thinking' | 'processing' | 'generating'
	size = 'medium' // 'small' | 'medium' | 'large'
}: {
	state?: 'thinking' | 'processing' | 'generating';
	size?: 'small' | 'medium' | 'large';
}) => {
	// Generate unique ID for this instance to avoid keyframe conflicts
	const animId = useRef(`wave-${Math.random().toString(36).substr(2, 9)}`).current;

	// Size configurations
	const sizeConfig = {
		small: { dot: 'w-1.5 h-1.5', gap: 'gap-1', container: 'py-1' },
		medium: { dot: 'w-2 h-2', gap: 'gap-1.5', container: 'py-2' },
		large: { dot: 'w-2.5 h-2.5', gap: 'gap-2', container: 'py-3' }
	};

	// State-based colors and speeds
	const stateConfig = {
		thinking: {
			color: 'var(--vscode-void-accent, #007acc)',
			duration: '1.4s',
			opacity: 0.7
		},
		processing: {
			color: 'var(--vscode-charts-orange, #f38500)',
			duration: '1.0s',
			opacity: 0.8
		},
		generating: {
			color: 'var(--vscode-charts-green, #388a34)',
			duration: '0.8s',
			opacity: 0.9
		}
	};

	const config = sizeConfig[size];
	const stateSettings = stateConfig[state];

	// Rotating loading messages so it doesn't feel repetitive
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

	// Advance message every few seconds while the indicator is mounted
	useEffect(() => {
		const interval = window.setInterval(() => {
			setMessageIndex((prev) => (prev + 1) % allMessages.length);
		}, 4500);
		return () => window.clearInterval(interval);
	}, [allMessages.length]);

	const currentMessage = allMessages[messageIndex] || allMessages[0];

	const textAnimId = `${animId}-text`;

	return (
		<>
			<style>{`
				@keyframes ${animId} {
					0%, 60%, 100% {
						transform: scale(1);
						opacity: ${stateSettings.opacity * 0.6};
					}
					30% {
						transform: scale(1.3);
						opacity: ${stateSettings.opacity};
					}
				}
				@keyframes ${textAnimId} {
					0% {
						background-position: -100% 50%;
					}
					100% {
						background-position: 200% 50%;
					}
				}
			`}</style>
			<div className={`flex items-center justify-between ${config.container}`}>
				<span
					className="text-xs select-none mr-3"
					style={{
						backgroundImage: `linear-gradient(90deg,
							var(--vscode-void-fg-3, #808080) 0%,
							var(--vscode-void-accent, #007acc) 45%,
							#ffffff 50%,
							var(--vscode-void-accent, #007acc) 55%,
							var(--vscode-void-fg-3, #808080) 100%)`,
						backgroundSize: '300% 100%',
						WebkitBackgroundClip: 'text',
						backgroundClip: 'text',
						color: 'var(--vscode-void-fg-3, #808080)',
						opacity: stateSettings.opacity,
						animation: `${textAnimId} 3s ease-in-out infinite`,
					}}
				>
					{currentMessage}
				</span>
				<div className={`flex ${config.gap}`}>
					<div
						className={`rounded-full ${config.dot}`}
						style={{
							backgroundColor: stateSettings.color,
							animation: `${animId} ${stateSettings.duration} ease-in-out infinite`,
							animationDelay: '0s'
						}}
					/>
					<div
						className={`rounded-full ${config.dot}`}
						style={{
							backgroundColor: stateSettings.color,
							animation: `${animId} ${stateSettings.duration} ease-in-out infinite`,
							animationDelay: '0.2s'
						}}
					/>
					<div
						className={`rounded-full ${config.dot}`}
						style={{
							backgroundColor: stateSettings.color,
							animation: `${animId} ${stateSettings.duration} ease-in-out infinite`,
							animationDelay: '0.4s'
						}}
					/>
				</div>
			</div>
		</>
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
						{toolName.replace(/_/g, ' ')}
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
 */
export const ExpandCollapse = ({ isExpanded, children }: { isExpanded: boolean, children: React.ReactNode }) => {
	const contentRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState<number | undefined>(isExpanded ? undefined : 0);

	useEffect(() => {
		if (contentRef.current) {
			const contentHeight = contentRef.current.scrollHeight;
			setHeight(isExpanded ? contentHeight : 0);
		}
	}, [isExpanded]);

	return (
		<div
			style={{
				height: height,
				overflow: 'hidden',
				transition: 'height 200ms ease-in-out',
			}}
		>
			<div ref={contentRef}>
				{children}
			</div>
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
 */
export const SmoothHeight = ({ children, isVisible }: { children: React.ReactNode, isVisible: boolean }) => {
	const contentRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState<number | 'auto'>(isVisible ? 'auto' : 0);

	useEffect(() => {
		if (contentRef.current) {
			if (isVisible) {
				const contentHeight = contentRef.current.scrollHeight;
				setHeight(contentHeight);
				const timer = setTimeout(() => setHeight('auto'), 300);
				return () => clearTimeout(timer);
			} else {
				const contentHeight = contentRef.current.scrollHeight;
				setHeight(contentHeight);
				const timer = setTimeout(() => setHeight(0), 50);
				return () => clearTimeout(timer);
			}
		}
	}, [isVisible]);

	return (
		<div
			style={{
				height: height,
				overflow: 'hidden',
				transition: 'height 300ms ease-in-out',
			}}
		>
			<div ref={contentRef}>
				{children}
			</div>
		</div>
	);
};
