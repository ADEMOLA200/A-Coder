/*---------------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0 See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react'
import { useAccessor } from '../util/services.js'
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js'
import { ToolName } from '../../../../common/toolsServiceTypes.js'

interface PlanningResultWrapperProps {
	toolMessage: {
		name: ToolName
		params: any
		content: string
		result?: any // Use any to handle different planning tool result structures
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
	const commandService = accessor.get('ICommandService')
	const chatThreadsService = accessor.get('IChatThreadService') as any

	const [refreshKey, setRefreshKey] = useState(0)
	const [latestPlanning, setLatestPlanning] = useState(toolMessage)
	const [isExpanded, setIsExpanded] = useState(true) // Add collapsible state

	// Check for newer planning updates in this thread
	useEffect(() => {
		const checkForUpdates = () => {
			if (!chatThreadsService) return
			const thread = chatThreadsService.state.allThreads[threadId]
			if (!thread) return

			const messages = thread.messages || []
			const planningMessages = messages.filter((m: any) =>
				m.name === 'create_plan' || m.name === 'update_task_status' || m.name === 'add_tasks_to_plan'
			)
			const latest = planningMessages[planningMessages.length - 1]

			if (latest && latest.id !== toolMessage.id) {
				setLatestPlanning(latest)
				setRefreshKey(prev => prev + 1)
			}
		}

		// Check immediately and then periodically
		checkForUpdates()
		const interval = setInterval(checkForUpdates, 2000)

		return () => clearInterval(interval)
	}, [threadId, toolMessage.id, chatThreadsService])

	const result = latestPlanning.result
	if (!result) {
		return <div className="p-3 text-void-fg-3">Planning tool result not available</div>
	}

	// Extract summary from different result structures
	const getSummary = () => {
		switch (toolMessage.name) {
			case 'create_plan':
				return result.summary || 'Plan created'
			case 'update_task_status':
				return result.summary || 'Task updated'
			case 'add_tasks_to_plan':
				return result.summary || 'Tasks added'
			case 'get_plan_status':
				return result.summary || result.status || 'Plan status retrieved'
			default:
				return result.summary || 'Operation completed'
		}
	}

	// Check if operation was successful (planning tools generally succeed if they have a result)
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
				className="bg-void-bg-2 px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-void-bg-3 transition-colors"
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
						<div className="text-xs text-void-fg-4 truncate">
							Planning operation completed successfully
						</div>
					</div>
				</div>
				{isSuccess && (
					<div className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md text-xs font-medium flex-shrink-0">
						Success
					</div>
				)}
			</div>

			{/* Collapsible Content */}
			{isExpanded && (
				<div className="p-3">
					<div className="text-sm font-medium text-void-fg-2 mb-2">Result:</div>
					<div className="bg-void-bg-1 border border-void-border-2 rounded-md p-4 max-h-64 overflow-y-auto prose prose-sm prose-invert max-w-none">
						<ChatMarkdownRender
							key={refreshKey}
							string={getSummary()}
							chatMessageLocation={undefined}
							isApplyEnabled={false}
							isLinkDetectionEnabled={true}
						/>
					</div>
				</div>
			)}

			{/* Update indicator */}
			{latestPlanning.id !== toolMessage.id && (
				<div className="px-3 pb-2 text-xs text-void-fg-4 italic">
					This plan has been updated. See latest version above.
				</div>
			)}
		</div>
	)
}

export default PlanningResultWrapper
