/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSettingsState } from '../util/services.js';
import { errorDetails } from '../../../../common/sendLLMMessageTypes.js';


export const ErrorDisplay = ({
	message: message_,
	fullError,
	onDismiss,
	showDismiss,
}: {
	message: string,
	fullError: Error | null,
	onDismiss: (() => void) | null,
	showDismiss?: boolean,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const details = errorDetails(fullError)
	const isExpandable = !!details

	const message = message_ + ''

	return (
		<div className={`rounded-lg border border-void-border-2 bg-void-bg-2 p-3 overflow-auto`}>
			{/* Header */}
			<div className='flex items-start justify-between'>
				<div className='flex gap-2'>
					<AlertCircle className='h-4 w-4 text-void-fg-3 mt-0.5 flex-shrink-0' />
					<div className='flex-1'>
						<h3 className='font-medium text-void-fg-2 text-sm'>
							{/* eg Error */}
							Error
						</h3>
						<p className='text-void-fg-3 mt-0.5 text-sm'>
							{/* eg Something went wrong */}
							{message}
						</p>
					</div>
				</div>

				<div className='flex gap-1'>
					{isExpandable && (
						<button className='text-void-fg-4 hover:text-void-fg-2 p-1 rounded transition-colors'
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? (
								<ChevronUp className='h-4 w-4' />
							) : (
								<ChevronDown className='h-4 w-4' />
							)}
						</button>
					)}
					{showDismiss && onDismiss && (
						<button className='text-void-fg-4 hover:text-void-fg-2 p-1 rounded transition-colors'
							onClick={onDismiss}
						>
							<X className='h-4 w-4' />
						</button>
					)}
				</div>
			</div>

			{/* Expandable Details */}
			{isExpanded && details && (
				<div className='mt-3 space-y-2 border-t border-void-border-2 pt-3 overflow-auto'>
					<div>
						<span className='font-medium text-void-fg-2 text-sm'>Full Error: </span>
						<pre className='text-void-fg-3 text-xs font-mono whitespace-pre-wrap'>{details}</pre>
					</div>
				</div>
			)}
		</div>
	);
};
