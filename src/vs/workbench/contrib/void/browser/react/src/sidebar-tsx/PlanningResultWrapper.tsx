/*---------------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0 See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react'
import { useAccessor } from '../util/services.js'
import { ToolName } from '../../../../common/toolsServiceTypes.js'
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js'

interface PlanningResultWrapperProps {
	toolMessage: {
		name: ToolName
		params: any
		content: string
		result?: any
		id: string
	}
	messageIdx: number
	threadId: string
}

const PlanningResultWrapper: React.FC<PlanningResultWrapperProps> = ({
	toolMessage,
	messageIdx,
	threadId
}) => {
	const accessor = useAccessor()
	const chatThreadsService = accessor.get('IChatThreadService') as any

	const [refreshKey, setRefreshKey] = useState(0)
	const [latestPlanning, setLatestPlanning] = useState(toolMessage)
	const [isExpanded, setIsExpanded] = useState(true)

	// Check for newer planning updates in this thread
	useEffect(() => {
		const checkForUpdates = () => {
			if (!chatThreadsService) return
			const thread = chatThreadsService.state.allThreads[threadId]
			if (!thread) return

			const messages = thread.messages || []
			const planningMessages = messages.filter((m: any) =>
				m.name === 'create_plan' || m.name === 'update_task_status' || m.name === 'add_tasks_to_plan' || m.name === 'get_plan_status'
			)
			const latest = planningMessages[planningMessages.length - 1]

			if (latest && latest.id !== toolMessage.id) {
				setLatestPlanning(latest)
				setRefreshKey(prev => prev + 1)
			}
		}

		checkForUpdates()
		const interval = setInterval(checkForUpdates, 2000)
		return () => clearInterval(interval)
	}, [threadId, toolMessage.id, chatThreadsService])

	const result = latestPlanning.result
	if (!result) {
		return <div className="p-3 text-void-fg-3">Planning tool result not available</div>
	}

	// Get the markdown summary from result
	const summary = result.summary || ''

	// Extract progress info from markdown or result
	const getProgressFromSummary = () => {
		// Try to parse progress from markdown like "**Progress:** 2/5 tasks completed"
		const match = summary.match(/\*\*Progress:\*\*\s*(\d+)\/(\d+)/)
		if (match) {
			return { completed: parseInt(match[1]), total: parseInt(match[2]) }
		}
		return null
	}

	const progress = getProgressFromSummary()
	const completedCount = progress?.completed ?? 0
	const totalCount = progress?.total ?? 0
	const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
	const isSuccess = result && !result.error

	const getToolIcon = () => {
		switch (toolMessage.name) {
			case 'create_plan': return '📋'
			case 'update_task_status': return '✅'
			case 'add_tasks_to_plan': return '➕'
			case 'get_plan_status': return '📊'
			default: return '🎯'
		}
	}

	const getToolTitle = () => {
		switch (toolMessage.name) {
			case 'create_plan': return 'Plan Created'
			case 'update_task_status': return 'Task Updated'
			case 'add_tasks_to_plan': return 'Tasks Added'
			case 'get_plan_status': return 'Plan Status'
			default: return 'Planning Operation'
		}
	}

	const getActionColor = () => {
		switch (toolMessage.name) {
			case 'create_plan': return 'text-blue-400'
			case 'update_task_status': return 'text-green-400'
			case 'add_tasks_to_plan': return 'text-purple-400'
			case 'get_plan_status': return 'text-orange-400'
			default: return 'text-void-fg-1'
		}
	}

	return (
		<div className="void-planning-result border border-void-border-2 rounded-lg overflow-hidden">
			{/* Header */}
			<div
				className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-void-bg-2 transition-colors"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<svg
						className={`w-4 h-4 text-void-fg-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} flex-shrink-0`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
					<span className={`text-lg ${getActionColor()} flex-shrink-0`}>{getToolIcon()}</span>
					<div className="min-w-0 flex-1">
						<div className="font-medium text-void-fg-1 truncate">
							{getToolTitle()}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2 flex-shrink-0">
					{totalCount > 0 && (
						<div className="text-xs text-void-fg-3">
							{completedCount}/{totalCount}
						</div>
					)}
					{isSuccess && totalCount > 0 && (
						<div className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md text-xs font-medium">
							{progressPercent === 100 ? 'Done' : `${progressPercent}%`}
						</div>
					)}
				</div>
			</div>

			{/* Progress bar */}
			{totalCount > 0 && (
				<div className="h-1 bg-void-bg-2">
					<div
						className="h-full bg-green-500 transition-all duration-300"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			)}

			{/* Collapsible Content - Full Markdown Preview */}
			{isExpanded && summary && (
				<div className="p-3 max-h-96 overflow-y-auto">
					<ChatMarkdownRender
						key={refreshKey}
						string={summary}
						chatMessageLocation={{ threadId, messageIdx }}
					/>
				</div>
			)}

			{/* Fallback for no summary */}
			{isExpanded && !summary && (
				<div className="p-3 text-sm text-void-fg-3">
					No plan details available.
				</div>
			)}

			{/* Update indicator */}
			{latestPlanning.id !== toolMessage.id && (
				<div className="px-3 pb-2 text-xs text-void-fg-4 italic border-t border-void-border-2 pt-2">
					This plan has been updated. See latest version above.
				</div>
			)}
		</div>
	)
}

export default PlanningResultWrapper
