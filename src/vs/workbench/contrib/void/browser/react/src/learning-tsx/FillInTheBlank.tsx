/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useRef } from 'react';

export interface FillInTheBlankProps {
	id?: string;
	initialValue?: string;
	placeholder?: string;
	onChange?: (value: string) => void;
	onEnter?: () => void;
	className?: string;
}

/**
 * An interactive inline input component for "Fill in the Blanks" exercises.
 * Used by ChatMarkdownRender when it detects [___] or similar patterns.
 */
export const FillInTheBlank: React.FC<FillInTheBlankProps> = ({
	initialValue = '',
	placeholder = '___',
	onChange,
	onEnter,
	className = '',
}) => {
	const [value, setValue] = useState(initialValue);
	const inputRef = useRef<HTMLInputElement>(null);
	const measureRef = useRef<HTMLSpanElement>(null);
	const [inputWidth, setInputWidth] = useState(0);

	// Synchronize width with content or placeholder
	useEffect(() => {
		if (measureRef.current) {
			const textToMeasure = value || placeholder;
			measureRef.current.textContent = textToMeasure;
			const width = measureRef.current.offsetWidth;
			// Minimum width to ensure it looks like a box, with extra padding for typing comfort
			setInputWidth(Math.max(width + 20, 60)); 
		}
	}, [value, placeholder]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setValue(newValue);
		onChange?.(newValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			onEnter?.();
		}
	};

	return (
		<span className={`inline-block relative align-middle mx-1 mb-0.5 group ${className}`}>
			{/* Hidden measurement span - uses same font as input to calculate width */}
			<span
				ref={measureRef}
				className="absolute -left-[9999px] -top-[9999px] whitespace-pre font-mono text-sm pointer-events-none opacity-0"
				aria-hidden="true"
			/>
			
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				style={{ width: `${inputWidth}px` }}
				title="Fill in the blank"
				className={`
					h-6 px-3 py-1 
					bg-void-bg-1 border border-void-border-2 rounded-md
					font-mono text-sm text-void-fg-1 placeholder:text-void-fg-4/30
					focus:outline-none focus:border-void-accent focus:ring-2 focus:ring-void-accent/15
					hover:border-void-border-1
					transition-all duration-150
					shadow-sm
				`}
			/>
		</span>
	);
};

export default FillInTheBlank;
