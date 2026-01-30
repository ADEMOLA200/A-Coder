/*---------------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { URI } from '../../../../../../../base/common/uri.js'
import { useAccessor } from '../util/services.js'
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js'
import { ToolName } from '../../../../common/toolsServiceTypes.js'

// Configuration constants
const PREVIEW_TRUNCATION_LENGTH = 1000 // Increased from 500 to 1000 chars
const PREVIEW_TAB_SCHEME = 'void-preview'

interface WalkthroughResultWrapperProps {
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

const WalkthroughResultWrapper: React.FC<WalkthroughResultWrapperProps> = ({
	toolMessage,
	messageIdx,
	threadId
}) => {
	const accessor = useAccessor()
	const commandService = accessor.get('ICommandService')
	const chatThreadsService = accessor.get('IChatThreadService') as any
	const agentManagerService = accessor.get('IAgentManagerService') as any

	const [refreshKey, setRefreshKey] = useState(0)
	const [latestWalkthrough, setLatestWalkthrough] = useState(toolMessage)
	const [isExpanded, setIsExpanded] = useState(true)
	const [showFullPreview, setShowFullPreview] = useState(false)

	// Store the messages length to detect changes without including the service in deps
	const messagesLengthRef = useRef(0)

	// Check for newer walkthrough updates in this thread
	const checkForUpdates = useCallback(() => {
		// Don't auto-update open_walkthrough_preview messages
		if (toolMessage.name === 'open_walkthrough_preview') return

		if (!chatThreadsService) return
		const thread = chatThreadsService.state.allThreads[threadId]
		if (!thread) return

		const messages = thread.messages || []
		// Store current length for next comparison
		messagesLengthRef.current = messages.length

		// Only look for other update_walkthrough messages to sync content
		const walkthroughMessages = messages.filter((m: any) => m.name === 'update_walkthrough')
		const latest = walkthroughMessages[walkthroughMessages.length - 1]

		if (latest && latest.id !== toolMessage.id) {
			setLatestWalkthrough(latest)
			setRefreshKey(prev => prev + 1)
		}
	}, [chatThreadsService, threadId, toolMessage.id, toolMessage.name])

	// Check for updates on mount and when messages change
	useEffect(() => {
		checkForUpdates()

		// Also check for updates when the preview tab might need refreshing
		const handleUpdateEvent = () => {
			checkForUpdates()
		}

		// Listen for custom event that can be triggered when preview tab is updated
		window.addEventListener('walkthrough-updated', handleUpdateEvent)

		return () => {
			window.removeEventListener('walkthrough-updated', handleUpdateEvent)
		}
	}, [checkForUpdates])

	// Watch for changes in messages length without including chatThreadsService in deps
	useEffect(() => {
		if (!chatThreadsService) return
		const thread = chatThreadsService.state.allThreads[threadId]
		if (!thread) return

		const currentLength = (thread.messages || []).length
		if (currentLength !== messagesLengthRef.current) {
			checkForUpdates()
		}
	}, [chatThreadsService, threadId, checkForUpdates])

	// Fix: Remove redundant nested property access
	const result = latestWalkthrough.result
	const toolName = latestWalkthrough.name

	if (!result || typeof result === 'string') {
		return (
			<div className="@@void-scope">
				<div className="void-walkthrough-result w-full rounded-xl overflow-hidden border border-void-border-2 bg-void-bg-2 shadow-sm">
					<div className="flex items-center gap-2 px-3 py-2">
						<div
							className="w-3 h-3 border-2 rounded-full border-void-accent"
							style={{
								borderTopColor: 'transparent',
								animation: 'spin 0.8s linear infinite'
							}}
						/>
						<span className="text-void-fg-3 text-sm">
							{toolName === 'update_walkthrough' ? 'Updating walkthrough...' : 'Preparing walkthrough...'}
						</span>
					</div>
				</div>
			</div>
		)
	}

	// Handle error case from the tool
	if (result.error) {
		return (
			<div className="@@void-scope">
				<div className="void-walkthrough-result border border-void-warning/50 rounded-lg overflow-hidden bg-void-warning/5 p-3">
					<div className="flex items-start gap-2 text-void-fg-1">
						<span className="text-lg">⚠️</span>
						<div className="flex flex-col">
							<span className="text-sm font-medium text-void-warning">Walkthrough update failed</span>
							<span className="text-xs text-void-fg-3 mt-1">{result.error}</span>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Handle open_walkthrough_preview tool result
	if (toolName === 'open_walkthrough_preview') {
		const filePath = result.message?.match(/for:\s*(.+)$/)?.[1] || 'walkthrough.md'

		return (
			<div className="@@void-scope">
				<div className="void-walkthrough-result border border-void-border-2 rounded-lg overflow-hidden bg-void-bg-2 p-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-void-fg-1">
							<span className="text-lg">👁️</span>
							<div className="flex flex-col">
								<span className="text-sm font-medium">Walkthrough preview opened</span>
								<span className="text-xs text-void-fg-4 font-mono truncate" title={filePath}>{filePath}</span>
							</div>
						</div>
						<span className="text-xs text-void-accent bg-void-accent/10 px-2 py-0.5 rounded border border-void-accent/20">
							Preview tab active
						</span>
					</div>
				</div>
			</div>
		)
	}

	// If it's not a walkthrough result object with preview, don't render
	if (!result.preview && !result.filePath) {
		return null
	}

	const openWalkthrough = async () => {
		if (!agentManagerService) {
			console.error('agentManagerService not available')
			return
		}

		try {
			// Always call openWalkthroughPreview, the service will decide how to handle it
			// (e.g., opening a React tab)
			await agentManagerService.openWalkthroughPreview(result.filePath, result.preview, { threadId })

			// Fire a custom event to notify any open preview tabs that content has changed
			window.dispatchEvent(new CustomEvent('walkthrough-updated', {
				detail: { filePath: result.filePath, threadId }
			}))
		} catch (error) {
			console.error('Failed to open walkthrough:', error)
			// Last resort fallback to raw file open
			if (commandService) {
				try {
					const uri = URI.file(result.filePath)
					await commandService.executeCommand('vscode.open', uri)
				} catch (fallbackError) {
					console.error('Fallback also failed:', fallbackError)
				}
			}
		}
	}

	const getActionIcon = () => {
		switch (result.action) {
			case 'created': return '📝'
			case 'updated': return '✏️'
			case 'appended': return '➕'
			default: return '📄'
		}
	}

	const getActionText = () => {
		switch (result.action) {
			case 'created': return 'Created'
			case 'updated': return 'Updated'
			case 'appended': return 'Appended to'
			default: return 'Modified'
		}
	}

	// Show either the full preview or truncated version based on state
	const displayPreview = showFullPreview
		? result.preview
		: result.preview.substring(0, PREVIEW_TRUNCATION_LENGTH) + (result.preview.length > PREVIEW_TRUNCATION_LENGTH ? '...' : '')

	const isTruncated = result.preview.length > PREVIEW_TRUNCATION_LENGTH

	return (
		<div className="@@void-scope">
			<div className="void-walkthrough-result border border-void-border-2 rounded-lg overflow-hidden bg-void-bg-4 shadow-sm">
				{/* Header */}
				<div className="bg-void-bg-4/50 px-3 py-2">
					<div
						className="flex items-center justify-between cursor-pointer hover:bg-void-bg-4-hover transition-colors rounded px-2 py-1"
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
							<span className="text-lg flex-shrink-0">{getActionIcon()}</span>
							<div className="min-w-0 flex-1">
								<div className="font-medium text-void-fg-1 truncate">
									Walkthrough {getActionText().toLowerCase()}
								</div>
								<div className="text-xs text-void-fg-4 font-mono truncate" title={result.filePath}>
									{result.filePath}
								</div>
							</div>
						</div>
						<button
							onClick={(e) => {
								e.stopPropagation() // Prevent header collapse when clicking Open
								openWalkthrough()
							}}
							className="px-3 py-1 bg-void-bg-3 hover:bg-void-bg-4 text-void-fg-1 border border-void-border-2 rounded-md text-sm flex items-center gap-1 transition-colors flex-shrink-0"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
							Open
						</button>
					</div>
				</div>

				{/* Collapsible Content */}
				{isExpanded && (
					<div className="p-3">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-void-fg-2">Preview:</span>
							{isTruncated && (
								<button
									onClick={() => setShowFullPreview(!showFullPreview)}
									className="text-xs text-void-accent hover:text-void-accent-hover transition-colors"
								>
									{showFullPreview ? 'Show less' : 'Show more'}
								</button>
							)}
						</div>
						<div className="bg-void-bg-4/40 border border-void-border-2 rounded-md p-4 max-h-[500px] overflow-y-auto prose prose-sm prose-invert max-w-none">
							<ChatMarkdownRender
								key={refreshKey}
								string={displayPreview}
								chatMessageLocation={undefined}
								isApplyEnabled={false}
								isLinkDetectionEnabled={true}
							/>
							{isTruncated && !showFullPreview && (
								<div className="text-xs text-void-fg-4 italic mt-2 text-center">
									... ({result.preview.length - PREVIEW_TRUNCATION_LENGTH} more characters)
								</div>
							)}
						</div>
					</div>
				)}

				{/* Update indicator */}
				{latestWalkthrough.id !== toolMessage.id && (
					<div className="px-3 pb-2 text-xs text-void-fg-4 italic">
						This walkthrough has been updated. See latest version above.
					</div>
				)}
			</div>
		</div>
	)
}

export default WalkthroughResultWrapper
