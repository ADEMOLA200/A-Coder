/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useRef } from 'react';
import { Server, Settings, X } from 'lucide-react';
import { useAccessor } from '../util/services.js';
import { VOID_TOGGLE_SETTINGS_ACTION_ID } from '../../../voidSettingsPane.js';

export const MCPServerModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
	const accessor = useAccessor();
	const mcpService = accessor.get('IMCPService');
	const commandService = accessor.get('ICommandService');
	const modalRef = useRef<HTMLDivElement>(null);

	// Get MCP servers
	const mcpTools = mcpService.getMCPTools() || [];

	// Group tools by server
	const serverGroups = mcpTools.reduce((acc, tool) => {
		const serverName = tool.mcpServerName || 'Unknown';
		if (!acc[serverName]) {
			acc[serverName] = [];
		}
		acc[serverName].push(tool);
		return acc;
	}, {} as Record<string, typeof mcpTools>);

	const serverNames = Object.keys(serverGroups);
	const serverCount = serverNames.length;

	// Close on escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};
		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
		}
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	const handleOpenSettings = () => {
		commandService.executeCommand(VOID_TOGGLE_SETTINGS_ACTION_ID);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 bg-black/20" onClick={onClose}>
			<div
				ref={modalRef}
				className="absolute top-20 right-4 w-80 bg-void-bg-1 border border-void-border-2 rounded-lg shadow-xl overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-void-border-2 bg-void-bg-2">
					<div className="flex items-center gap-2">
						<span className="text-void-fg-3 text-sm font-medium">{serverCount} MCP</span>
						<button
							className="p-1 hover:bg-void-bg-3 rounded transition-colors"
							data-tooltip-id="void-tooltip"
							data-tooltip-content="Refresh"
						>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-void-fg-3">
								<path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
							</svg>
						</button>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:bg-void-bg-3 rounded transition-colors"
					>
						<X size={16} className="text-void-fg-3" />
					</button>
				</div>

				{/* Server List */}
				<div className="max-h-96 overflow-y-auto">
					{serverCount === 0 ? (
						<div className="px-4 py-8 text-center text-void-fg-4 text-sm">
							No MCP servers configured
						</div>
					) : (
						serverNames.map((serverName) => {
							const tools = serverGroups[serverName] || [];
							const toolCount = tools.length;

							return (
								<div
									key={serverName}
									className="px-4 py-3 hover:bg-void-bg-2 transition-colors cursor-pointer border-b border-void-border-3 last:border-b-0"
								>
									<div className="flex items-center gap-3">
										{/* Status indicator */}
										<div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_0px_rgba(34,197,94,0.6)]" />

										{/* Server name and tool count */}
										<div className="flex-1">
											<div className="text-void-fg-2 text-sm font-medium">{serverName}</div>
											<div className="text-void-fg-4 text-xs">{toolCount}</div>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>

				{/* Footer - MCP Marketplace */}
				<div
					onClick={handleOpenSettings}
					className="px-4 py-3 border-t border-void-border-2 bg-void-bg-2 hover:bg-void-bg-3 transition-colors cursor-pointer"
				>
					<div className="flex items-center gap-3">
						<Settings size={16} className="text-void-fg-3" />
						<span className="text-void-fg-2 text-sm">MCP Marketplace</span>
					</div>
				</div>
			</div>
		</div>
	);
};
