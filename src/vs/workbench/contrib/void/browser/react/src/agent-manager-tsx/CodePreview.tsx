/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { memo } from 'react';
import { Code, FileCode } from 'lucide-react';
import { BlockCode } from '../util/inputs.js';
import { URI } from '../../../../../../../base/common/uri.js';
import { useFileContent } from '../util/services.js';

interface CodePreviewProps {
	selectedFileUri: URI | null;
}

export const CodePreview = memo(({ selectedFileUri }: CodePreviewProps) => {
	const { content, loading } = useFileContent(selectedFileUri);

	if (loading) {
		return (
			<div className="h-full flex flex-col items-center justify-center text-void-fg-4 gap-4 bg-void-bg-2">
				<div className="relative">
					<div className="w-12 h-12 border-3 border-void-accent/20 border-t-void-accent rounded-full animate-spin" />
					<div className="absolute inset-0 flex items-center justify-center">
						<Code className="w-5 h-5 text-void-accent" />
					</div>
				</div>
				<div className="text-center">
					<span className="text-xs font-semibold text-void-fg-3 uppercase tracking-widest">Loading Preview</span>
				</div>
			</div>
		);
	}

	if (!content || !selectedFileUri) {
		return (
			<div className="h-full flex flex-col items-center justify-center text-void-fg-4 bg-void-bg-2 border border-dashed border-void-border-2 m-6 rounded-2xl">
				<div className="w-16 h-16 rounded-2xl bg-void-bg-3 flex items-center justify-center mb-4 shadow-md border border-void-border-2">
					<FileCode className="w-8 h-8 text-void-fg-4" />
				</div>
				<div className="text-center px-8">
					<h3 className="text-sm font-semibold text-void-fg-2 mb-1">No File Selected</h3>
					<p className="text-xs text-void-fg-4 max-w-[200px]">Click on a file or walkthrough to preview its contents here.</p>
				</div>
			</div>
		);
	}

	const extension = selectedFileUri.fsPath.split('.').pop() || '';

	return (
		<div className="h-full flex flex-col bg-void-bg-3 border-l border-void-border-2 shadow-lg">
			<div className="flex-1 overflow-hidden">
				<BlockCode
					initValue={content}
					language={extension}
					maxHeight={Infinity}
					showScrollbars={true}
				/>
			</div>
		</div>
	);
});

CodePreview.displayName = 'CodePreview';