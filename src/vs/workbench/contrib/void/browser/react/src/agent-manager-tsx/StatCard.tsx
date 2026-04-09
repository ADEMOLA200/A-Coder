/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { memo } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
	icon: LucideIcon;
	label: string;
	value: string | number;
	trend?: string;
	color: string;
}

export const StatCard = memo(({ icon: Icon, label, value, trend, color }: StatCardProps) => {
	return (
		<div className={`relative overflow-hidden rounded-2xl border border-void-border-2 bg-gradient-to-br ${color} shadow-md hover:shadow-lg transition-all duration-300 group`}>
			<div className="p-5">
				<div className="flex items-start justify-between mb-4">
					<div className="p-3 rounded-xl bg-void-bg-3 border border-void-border-2">
						<Icon className="w-5 h-5 text-void-fg-1" aria-hidden="true" />
					</div>
					{trend && (
						<span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase border border-emerald-500/20">
							{trend}
						</span>
					)}
				</div>
				<div className="space-y-1">
					<div className="text-3xl font-black text-void-fg-1 tracking-tighter">{value}</div>
					<div className="text-[10px] font-bold text-void-fg-4 uppercase tracking-widest">{label}</div>
				</div>
			</div>
		</div>
	);
});

StatCard.displayName = 'StatCard';
