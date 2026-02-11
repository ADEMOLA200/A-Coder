/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React from 'react';
import { Zap, Check, Info, Loader2 } from 'lucide-react';
import { useAccessor, useChatThreadsStreamState } from '../util/services.js';
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js';
import { 
	ToolHeaderWrapper, 
	ToolChildrenWrapper, 
	SmallProseWrapper, 
	ResultWrapper,
	ToolHeaderParams,
	getTitle,
	toolNameToDesc,
	BottomChildren,
	CodeChildren
} from './ToolResultHelpers.js';

export const SkillsResultWrapper: ResultWrapper<'load_skill' | 'list_skills'> = ({ toolMessage, threadId }) => {
	const accessor = useAccessor()
	const streamState = useChatThreadsStreamState(threadId)
	const title = getTitle(toolMessage)
	const { desc1, desc1Info } = toolNameToDesc(toolMessage.name as 'load_skill' | 'list_skills', toolMessage.params, accessor)

	const isRejected = toolMessage.type === 'rejected'
	const componentParams: ToolHeaderParams = { title, desc1, desc1Info, isError: false, icon: <Zap size={12} className="text-void-accent" />, isRejected }

	if (toolMessage.type === 'running_now') {
		const activity = streamState?.isRunning === 'tool' && streamState.toolInfo.id === toolMessage.id
			? streamState.toolInfo.content
			: undefined;

		if (activity) {
			componentParams.children = (
				<ToolChildrenWrapper>
					<div className="flex items-center gap-2 py-1">
						<Loader2 className="w-3 h-3 animate-spin text-void-accent" />
						<span className="text-xs italic text-void-fg-3">{activity}</span>
					</div>
				</ToolChildrenWrapper>
			)
			componentParams.isOpen = true;
		}
	} else if (toolMessage.type === 'success') {
		const result = (toolMessage.result as any)?.result || toolMessage.result
		componentParams.isOpen = true; // Auto-expand on success
		
		if (toolMessage.name === 'load_skill') {
			const { skill_name, instructions, success } = result as any
			componentParams.children = (
				<ToolChildrenWrapper>
					<div className="space-y-3">
						<div className="flex items-center gap-2 text-void-fg-1 font-medium">
							{success ? <Check size={14} className="text-green-500" /> : <Info size={14} className="text-void-warning" />}
							<span>{success ? `Skill "${skill_name}" successfully loaded` : `Failed to load skill "${skill_name}"`}</span>
						</div>
						{success && (
							<div className="bg-void-bg-4/30 rounded-md p-3 border border-void-border-2">
								<div className="text-[10px] uppercase tracking-wider font-bold text-void-fg-4 mb-2">Instructions Applied:</div>
								<SmallProseWrapper>
									<ChatMarkdownRender
										string={instructions}
										chatMessageLocation={undefined}
										isApplyEnabled={false}
										isLinkDetectionEnabled={true}
									/>
								</SmallProseWrapper>
							</div>
						)}
					</div>
				</ToolChildrenWrapper>
			)
		} else if (toolMessage.name === 'list_skills') {
			const { skills } = result as any
			componentParams.children = (
				<ToolChildrenWrapper>
					<div className="space-y-3">
						<div className="text-xs text-void-fg-3">Available specialized skills:</div>
						<div className="grid gap-2">
							{skills && skills.length > 0 ? (
								skills.map((skill: any) => (
									<div key={skill.name} className="p-2 bg-void-bg-4/30 border border-void-border-2 rounded-md">
										<div className="flex items-center gap-2 mb-1">
											<Zap size={10} className="text-void-accent" />
											<span className="text-xs font-bold text-void-fg-1">{skill.name}</span>
										</div>
										<div className="text-[11px] text-void-fg-3 line-clamp-2">{skill.description}</div>
									</div>
								))
							) : (
								<div className="text-xs italic text-void-fg-4 p-2">No skills currently installed.</div>
							)}
						</div>
					</div>
				</ToolChildrenWrapper>
			)
		}
	}

	return <ToolHeaderWrapper {...componentParams} />
}
