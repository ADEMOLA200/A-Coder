/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { memo } from 'react';
import type { LucideIcon } from 'lucide-react';

interface ActivityItemProps {
	icon: LucideIcon;
	title: string;
	subtitle: string;
	time: string;
	status: 'success' | 'progress' | 'error';
	onClick?: () => void;
}

const STATUS_COLORS = {
	success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
	progress: 'bg-void-accent/10 text-void-accent border-void-accent/20',
	error: 'bg-red-500/10 text-red-500 border-red-500/20',
} as const;

const STATUS_LABELS = {
	success: 'Done',
	progress: 'Active',
	error: 'Error',
} as const;

export const ActivityItem = memo(({ icon: Icon, title, subtitle, time, status, onClick }: ActivityItemProps) => {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.();
		}
	};

	return (
		<div
			className="group p-4 rounded-xl border border-void-border-2 bg-void-bg-2/30 hover:bg-void-bg-2/50 hover:border-void-border-1 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-void-accent focus:ring-offset-2"
			onClick={onClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
			aria-label={`${title}: ${STATUS_LABELS[status]}`}
		>
			<div className="flex items-start gap-4">
				<div className="flex-shrink-0 w-10 h-10 rounded-xl bg-void-bg-3 border border-void-border-2 flex items-center justify-center shadow-md group-hover:border-void-accent/40 group-focus:border-void-accent/40 transition-all">
					<Icon className="w-5 h-5 text-void-fg-4 group-hover:text-void-accent group-focus:text-void-accent transition-colors" aria-hidden="true" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-void-fg-1 truncate group-hover:text-void-accent group-focus:text-void-accent transition-colors">{title}</p>
					<p className="text-[10px] text-void-fg-4/60 mt-1 truncate font-mono">{subtitle}</p>
				</div>
				<div className="flex flex-col items-end gap-2 flex-shrink-0">
					<span className="text-[10px] font-bold text-void-fg-4/40 uppercase tracking-tighter">{time}</span>
					<div className={`px-2 py-0.5 rounded-lg ${STATUS_COLORS[status]} text-[9px] font-black uppercase border`}>
						{STATUS_LABELS[status]}
					</div>
				</div>
			</div>
		</div>
	);
});

ActivityItem.displayName = 'ActivityItem';