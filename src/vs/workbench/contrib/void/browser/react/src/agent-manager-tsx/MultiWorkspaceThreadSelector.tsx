/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useMemo, useState } from 'react';
import { WorkspaceThreadSummary, WorkspaceConnection } from '../../../../common/workspaceRegistryTypes.js';
import { useAllWorkspaces, useSelectedWorkspace, useMultiWorkspaceSearch } from '../util/services.js';
import { MessageSquare, Clock, Circle, Search, X, Folder } from 'lucide-react';

/**
 * Thread status badge
 */
const ThreadStatusBadge = ({ status }: { status: WorkspaceThreadSummary['status'] }) => {
	const config = {
		idle: { bg: 'bg-void-bg-2', text: 'text-void-fg-4', label: 'Idle' },
		streaming: { bg: 'bg-void-accent/10', text: 'text-void-accent', label: 'Active', animate: true },
		awaiting_user: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Waiting' },
		error: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Error' }
	};

	const { bg, text, label, animate } = config[status];

	return (
		<span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${bg} ${text}`}>
			{animate && <Circle className="w-1.5 h-1.5 fill-current animate-pulse" />}
			{label}
		</span>
	);
};

/**
 * Thread item with workspace context
 */
const ThreadItem = ({
	thread,
	workspaceName,
	workspaceColor,
	onClick
}: {
	thread: WorkspaceThreadSummary & { workspaceName: string, workspaceColor: string },
	workspaceName: string,
	workspaceColor: string,
	onClick?: () => void
}) => {
	const timeAgo = useMemo(() => {
		const diff = Date.now() - thread.timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return 'just now';
	}, [thread.timestamp]);

	return (
		<button
			onClick={onClick}
			className="group w-full text-left p-3 rounded-xl border border-void-border-2 bg-void-bg-2/30 hover:bg-void-bg-2/50 hover:border-void-border-1 transition-all"
		>
			<div className="flex items-start gap-3">
				{/* Workspace color dot */}
				<div
					className="flex-shrink-0 w-3 h-3 rounded-full mt-1"
					style={{ backgroundColor: workspaceColor }}
					title={workspaceName}
				/>

				<div className="flex-1 min-w-0">
					{/* Title row */}
					<div className="flex items-center gap-2 mb-1">
						<span className="text-sm font-medium text-void-fg-1 truncate">{thread.title}</span>
						<ThreadStatusBadge status={thread.status} />
					</div>

					{/* Last message preview */}
					<p className="text-[11px] text-void-fg-4 truncate mb-2 opacity-70">
						{thread.lastMessage || 'No messages'}
					</p>

					{/* Meta row */}
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1">
							<MessageSquare className="w-3 h-3 text-void-fg-4" />
							<span className="text-[10px] text-void-fg-4">{thread.messageCount}</span>
						</div>
						<div className="flex items-center gap-1">
							<Clock className="w-3 h-3 text-void-fg-4" />
							<span className="text-[10px] text-void-fg-4">{timeAgo}</span>
						</div>
						<span className="text-[10px] text-void-fg-4 opacity-60 truncate">{workspaceName}</span>
					</div>
				</div>
			</div>
		</button>
	);
};

/**
 * Threads grouped by workspace
 */
const WorkspaceThreadGroup = ({
	workspace,
	isExpanded,
	onToggle
}: {
	workspace: WorkspaceConnection,
	isExpanded: boolean,
	onToggle: () => void
}) => {
	const sortedThreads = useMemo(() => {
		return [...workspace.threads].sort((a, b) => b.timestamp - a.timestamp);
	}, [workspace.threads]);

	return (
		<div className="border border-void-border-2 rounded-xl overflow-hidden">
			{/* Workspace header */}
			<button
				onClick={onToggle}
				className="w-full flex items-center gap-3 p-3 bg-void-bg-2/50 hover:bg-void-bg-2/70 transition-colors"
			>
				<div
					className="w-4 h-4 rounded flex items-center justify-center"
					style={{ backgroundColor: workspace.color + '20' }}
				>
					<Folder className="w-3 h-3" style={{ color: workspace.color }} />
				</div>
				<span className="text-sm font-semibold text-void-fg-1 flex-1 text-left truncate">{workspace.name}</span>
				<span className="text-[10px] font-medium text-void-fg-4 px-1.5 py-0.5 rounded bg-void-bg-1">
					{workspace.threads.length}
				</span>
				<svg
					className={`w-4 h-4 text-void-fg-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{/* Threads */}
			{isExpanded && (
				<div className="p-2 space-y-2 border-t border-void-border-2/50 bg-void-bg-1/30">
					{sortedThreads.length === 0 ? (
						<div className="text-center py-4 text-void-fg-4 text-xs">No threads</div>
					) : (
						sortedThreads.map(thread => (
							<div
								key={thread.id}
								className="p-2 rounded-lg bg-void-bg-2/30 hover:bg-void-bg-2/50 transition-colors cursor-pointer"
							>
								<div className="flex items-center gap-2 mb-1">
									<span className="text-xs font-medium text-void-fg-1 truncate flex-1">{thread.title}</span>
									<ThreadStatusBadge status={thread.status} />
								</div>
								<div className="flex items-center gap-2 text-[10px] text-void-fg-4">
									<span>{thread.messageCount} msgs</span>
									<span>•</span>
									<span>{new Date(thread.timestamp).toLocaleTimeString()}</span>
								</div>
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
};

/**
 * Multi-workspace thread selector with search
 */
export const MultiWorkspaceThreadSelector = () => {
	const workspaces = useAllWorkspaces();
	const { selectedId } = useSelectedWorkspace();
	const [searchQuery, setSearchQuery] = useState('');
	const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());

	// Filter workspaces by selection
	const filteredWorkspaces = useMemo(() => {
		if (selectedId) {
			return workspaces.filter(w => w.id === selectedId);
		}
		return workspaces.filter(w => w.status === 'connected');
	}, [workspaces, selectedId]);

	// Search across all threads
	const searchResults = useMultiWorkspaceSearch(searchQuery);

	// Toggle workspace expansion
	const toggleWorkspace = (workspaceId: string) => {
		setExpandedWorkspaces(prev => {
			const next = new Set(prev);
			if (next.has(workspaceId)) {
				next.delete(workspaceId);
			} else {
				next.add(workspaceId);
			}
			return next;
		});
	};

	// Initialize expanded workspaces
	React.useEffect(() => {
		if (expandedWorkspaces.size === 0 && filteredWorkspaces.length > 0) {
			setExpandedWorkspaces(new Set(filteredWorkspaces.slice(0, 2).map(w => w.id)));
		}
	}, [filteredWorkspaces, expandedWorkspaces.size]);

	return (
		<div className="flex flex-col h-full">
			{/* Search bar */}
			<div className="p-3 border-b border-void-border-2">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-void-fg-4 opacity-40" />
					<input
						type="text"
						placeholder="Search across all workspaces..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full bg-void-bg-1 border border-void-border-2 rounded-lg pl-9 pr-8 py-2 text-xs text-void-fg-1 placeholder:text-void-fg-4 focus:outline-none focus:border-void-accent/50 transition-all"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery('')}
							className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-void-bg-2 rounded transition-colors"
						>
							<X className="w-3 h-3 text-void-fg-4" />
						</button>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-3">
				{searchQuery ? (
					// Search results view
					<div className="space-y-2">
						{searchResults.length === 0 ? (
							<div className="text-center py-8 text-void-fg-4">
								<p className="text-xs font-medium">No results found</p>
								<p className="text-[10px] opacity-60 mt-1">Try a different search term</p>
							</div>
						) : (
							searchResults.map(result => (
								<div
									key={`${result.workspaceId}-${result.id}`}
									className="p-3 rounded-lg bg-void-bg-2/30 hover:bg-void-bg-2/50 transition-colors cursor-pointer"
								>
									<div className="flex items-center gap-2 mb-1">
										<div
											className="w-2 h-2 rounded-full"
											style={{ backgroundColor: result.workspaceColor }}
										/>
										<span className="text-xs font-medium text-void-fg-1 truncate flex-1">{result.title}</span>
										<ThreadStatusBadge status={result.status} />
									</div>
									<p className="text-[10px] text-void-fg-4 truncate mb-1 opacity-70">{result.lastMessage}</p>
									<div className="flex items-center gap-2 text-[10px] text-void-fg-4 opacity-60">
										<span>{result.workspaceName}</span>
										<span>•</span>
										<span>{result.messageCount} msgs</span>
									</div>
								</div>
							))
						)}
					</div>
				) : (
					// Grouped view by workspace
					<div className="space-y-3">
						{filteredWorkspaces.map(workspace => (
							<WorkspaceThreadGroup
								key={workspace.id}
								workspace={workspace}
								isExpanded={expandedWorkspaces.has(workspace.id)}
								onToggle={() => toggleWorkspace(workspace.id)}
							/>
						))}
						{filteredWorkspaces.length === 0 && (
							<div className="text-center py-8 text-void-fg-4">
								<p className="text-xs font-medium">No workspaces available</p>
								<p className="text-[10px] opacity-60 mt-1">Open a workspace to see its threads</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};