/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { memo } from 'react';
import type { LucideIcon } from 'lucide-react';

interface NavButtonProps {
	active: boolean;
	onClick: () => void;
	icon: LucideIcon;
	label?: string;
	title: string;
}

export const NavButton = memo(({ active, onClick, icon: Icon, label, title }: NavButtonProps) => {
	return (
		<button
			onClick={onClick}
			className="relative group w-full focus:outline-none focus:ring-2 focus:ring-void-accent focus:ring-offset-2 focus:ring-offset-void-bg-2 rounded-xl"
			title={title}
			aria-label={title}
			aria-pressed={active}
		>
			<div className={`
				flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
				${active
					? 'bg-void-accent text-white shadow-lg shadow-void-accent/30'
					: 'text-void-fg-4 hover:text-void-fg-1 hover:bg-void-bg-2/50'
				}
			`}>
				<Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
				{label && <span className="text-sm font-medium tracking-tight">{label}</span>}
			</div>
			{active && (
				<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-void-accent rounded-r-full shadow-[0_0_10px_rgba(var(--void-accent-rgb),0.5)]" aria-hidden="true" />
			)}
		</button>
	);
});

NavButton.displayName = 'NavButton';