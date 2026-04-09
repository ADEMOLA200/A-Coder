/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { memo } from 'react';
import { Folder, ExternalLink } from 'lucide-react';

interface WorkspaceCardProps {
	folder: {
		name: string;
		uri: {
			fsPath: string;
			toString(): string;
		};
	};
	index: number;
	onClick?: () => void;
}

const GRADIENT_COLORS = [
	'from-blue-500/10 to-purple-500/10',
	'from-emerald-500/10 to-cyan-500/10',
	'from-orange-500/10 to-red-500/10',
	'from-pink-500/10 to-violet-500/10',
] as const;

export const WorkspaceCard = memo(({ folder, index, onClick }: WorkspaceCardProps) => {

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.();
		}
	};

	return (
		<div
			className="group overflow-hidden rounded-2xl border border-void-border-2 bg-void-bg-2 hover:border-void-accent/40 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-void-accent focus:ring-offset-2"
			onClick={onClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
			aria-label={`Open workspace ${folder.name}`}
		>
			
			<div className="p-4 flex items-center gap-4">
				<div className="flex-shrink-0 w-12 h-12 rounded-xl bg-void-bg-3 border border-void-border-2 flex items-center justify-center shadow-lg group-hover:border-void-accent/50 group-focus:border-void-accent/50 group-hover:scale-110 transition-all">
					<Folder className="w-6 h-6 text-void-fg-4 group-hover:text-void-accent group-focus:text-void-accent transition-colors" />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-bold text-void-fg-1 truncate tracking-tight">{folder.name}</span>
						<div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" aria-hidden="true" />
					</div>
					<span className="text-[10px] text-void-fg-4 truncate block mt-0.5 font-mono">{folder.uri.fsPath}</span>
				</div>
				<ExternalLink className="w-4 h-4 text-void-fg-4 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all flex-shrink-0" aria-hidden="true" />
			</div>
		</div>
	);
});

WorkspaceCard.displayName = 'WorkspaceCard';