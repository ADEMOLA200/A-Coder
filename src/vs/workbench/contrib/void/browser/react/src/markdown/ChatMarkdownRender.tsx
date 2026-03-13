/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { JSX, useMemo, useState } from 'react'
import { marked, MarkedToken, Token } from 'marked'

import { convertToVscodeLang, detectLanguage } from '../../../../common/helpers/languageHelpers.js'
import { BlockCodeApplyWrapper } from './ApplyBlockHoverButtons.js'
import { useAccessor } from '../util/services.js'
import { URI } from '../../../../../../../base/common/uri.js'
import { isAbsolute } from '../../../../../../../base/common/path.js'
import { separateOutFirstLine } from '../../../../common/helpers/util.js'
import { BlockCode } from '../util/inputs.js'
import { CodespanLocationLink } from '../../../../common/chatThreadServiceTypes.js'
import { getBasename, getRelative, voidOpenFileFn } from '../sidebar-tsx/ToolResultHelpers.js'
import { ChartRender, parseChartDefinition } from './ChartRender.js'
import { LatexRender, LatexTextRender } from './LatexRender.js'


export type ChatMessageLocation = {
	threadId: string;
	messageIdx: number;
}

type ApplyBoxLocation = ChatMessageLocation & { tokenIdx: string }

export const getApplyBoxId = ({ threadId, messageIdx, tokenIdx }: ApplyBoxLocation) => {
	return `${threadId}-${messageIdx}-${tokenIdx}`
}

function isValidUri(s: string): boolean {
	return s.length > 5 && isAbsolute(s) && !s.includes('//') && !s.includes('/*') // common case that is a false positive is comments like //
}

const Codespan = ({ text, className, onClick, tooltip }: { text: string, className?: string, onClick?: () => void, tooltip?: string }) => {

	// TODO compute this once for efficiency. we should use `labels.ts/shorten` to display duplicates properly

	return <code
		className={`font-mono font-medium rounded-sm bg-void-bg-1 px-1 ${className}`}
		onClick={onClick}
		{...tooltip ? {
			'data-tooltip-id': 'void-tooltip',
			'data-tooltip-content': tooltip,
			'data-tooltip-place': 'top',
		} : {}}
	>
		{text}
	</code>

}

const CodespanWithLink = ({ text, rawText, chatMessageLocation }: { text: string, rawText: string, chatMessageLocation: ChatMessageLocation }) => {

	const accessor = useAccessor()

	const chatThreadService = accessor.get('IChatThreadService')
	const commandService = accessor.get('ICommandService')
	const editorService = accessor.get('ICodeEditorService')

	const { messageIdx, threadId } = chatMessageLocation

	const [didComputeCodespanLink, setDidComputeCodespanLink] = useState<boolean>(false)

	let link: CodespanLocationLink | undefined = undefined
	let tooltip: string | undefined = undefined
	let displayText = text


	if (rawText.endsWith('`')) {
		// get link from cache
		link = chatThreadService.getCodespanLink({ codespanStr: text, messageIdx, threadId })

		if (link === undefined) {
			// if no link, generate link and add to cache
			chatThreadService.generateCodespanLink({ codespanStr: text, threadId })
				.then(link => {
					chatThreadService.addCodespanLink({ newLinkText: text, newLinkLocation: link, messageIdx, threadId })
					setDidComputeCodespanLink(true) // rerender
				})
		}

		if (link?.displayText) {
			displayText = link.displayText
		}

		if (isValidUri(displayText)) {
			tooltip = getRelative(URI.file(displayText), accessor)  // Full path as tooltip
			displayText = getBasename(displayText)
		}
	}


	const onClick = () => {
		if (!link) return;
		// Use the updated voidOpenFileFn to open the file and handle selection
		if (link.selection)
			voidOpenFileFn(link.uri, accessor, [link.selection.startLineNumber, link.selection.endLineNumber]);
		else
			voidOpenFileFn(link.uri, accessor);
	}

	return <Codespan
		text={displayText}
		onClick={onClick}
		className={link ? 'underline hover:brightness-90 transition-all duration-200 cursor-pointer' : ''}
		tooltip={tooltip || undefined}
	/>
}


const paragraphToLatexSegments = (paragraphText: string) => {

	const segments: React.ReactNode[] = [];

	if (paragraphText
		&& !(paragraphText.includes('#') || paragraphText.includes('`')) // don't process latex if a codespan or header tag
		&& !/^[\w\s.()[\]{}]+$/.test(paragraphText) // don't process latex if string only contains alphanumeric chars, whitespace, periods, and brackets
	) {
		const rawText = paragraphText;
		// Regular expressions to match LaTeX delimiters
		const displayMathRegex = /\$\$(.*?)\$\$/g;  // Display math: $$...$$
		const inlineMathRegex = /\$((?!\$).*?)\$/g; // Inline math: $...$ (but not $$)

		// Check if the paragraph contains any LaTeX expressions
		if (displayMathRegex.test(rawText) || inlineMathRegex.test(rawText)) {
			// Reset the regex state (since we used .test earlier)
			displayMathRegex.lastIndex = 0;
			inlineMathRegex.lastIndex = 0;

			// Parse the text into segments of regular text and LaTeX
			let lastIndex = 0;
			let segmentId = 0;

			// First replace display math ($$...$$)
			let match;
			while ((match = displayMathRegex.exec(rawText)) !== null) {
				const [fullMatch, formula] = match;
				const matchIndex = match.index;

				// Add text before the LaTeX expression
				if (matchIndex > lastIndex) {
					const textBefore = rawText.substring(lastIndex, matchIndex);
					segments.push(
						<span key={`text-${segmentId++}`}>
							{textBefore}
						</span>
					);
				}

				// Add the LaTeX expression
				segments.push(
					<LatexRender key={`latex-${segmentId++}`} latex={fullMatch} />
				);

				lastIndex = matchIndex + fullMatch.length;
			}

			// Add any remaining text (which might contain inline math)
			if (lastIndex < rawText.length) {
				const remainingText = rawText.substring(lastIndex);

				// Process inline math in the remaining text
				lastIndex = 0;
				inlineMathRegex.lastIndex = 0;
				const inlineSegments: React.ReactNode[] = [];

				while ((match = inlineMathRegex.exec(remainingText)) !== null) {
					const [fullMatch] = match;
					const matchIndex = match.index;

					// Add text before the inline LaTeX
					if (matchIndex > lastIndex) {
						const textBefore = remainingText.substring(lastIndex, matchIndex);
						inlineSegments.push(
							<span key={`inline-text-${segmentId++}`}>
								{textBefore}
							</span>
						);
					}

					// Add the inline LaTeX
					inlineSegments.push(
						<LatexRender key={`inline-latex-${segmentId++}`} latex={fullMatch} />
					);

					lastIndex = matchIndex + fullMatch.length;
				}

				// Add any remaining text after all inline math
				if (lastIndex < remainingText.length) {
					inlineSegments.push(
						<span key={`inline-final-${segmentId++}`}>
							{remainingText.substring(lastIndex)}
						</span>
					);
				}

				segments.push(...inlineSegments);
			}


		}
	}


	return segments
}


export type RenderTokenOptions = { isApplyEnabled?: boolean, isLinkDetectionEnabled?: boolean }
// Memoize RenderToken to avoid unnecessary work for tokens that haven't changed.
// Since 'marked' returns new objects, we use a custom comparison if possible, or just memoize for React's optimization.
const RenderToken = React.memo(({ token, inPTag, codeURI, chatMessageLocation, tokenIdx, ...options }: { token: Token | string, inPTag?: boolean, codeURI?: URI, chatMessageLocation?: ChatMessageLocation, tokenIdx: string, } & RenderTokenOptions): React.ReactNode => {
	const accessor = useAccessor()
	const languageService = accessor.get('ILanguageService')

	// deal with built-in tokens first (assume marked token)
	const t = token as MarkedToken

	if (t.raw.trim() === '') {
		return null;
	}

	if (t.type === 'space') {
		return <span>{t.raw}</span>
	}

	if (t.type === 'code') {
		const [firstLine, remainingContents] = separateOutFirstLine(t.text)
		const firstLineIsURI = isValidUri(firstLine) && !codeURI
		const contents = firstLineIsURI ? (remainingContents?.trimStart() || '') : t.text // exclude first-line URI from contents

		if (!contents) return null

		// Check if this is a chart definition (JSON or simple syntax)
		const isChart = t.lang === 'chart' || t.lang === 'recharts' ||
			contents.trim().startsWith('{') && (contents.includes('"type"') && contents.includes('"data"')) ||
			contents.trim().startsWith('type:') && contents.includes('data:')

		if (isChart) {
			const chartConfig = parseChartDefinition(contents)
			if (chartConfig) {
				return <ChartRender config={chartConfig} className="my-4" />
			}
		}

		// Check if this is LaTeX math
		const isLatex = t.lang === 'latex' || t.lang === 'math' || t.lang === 'tex'
		if (isLatex) {
			return (
				<div className="my-4 p-4 bg-void-bg-2 rounded-lg border border-void-border-2 overflow-x-auto">
					<LatexRender latex={contents} displayMode={true} />
				</div>
			)
		}

		// figure out langauge and URI
		let uri: URI | null
		let language: string
		if (codeURI) {
			uri = codeURI
		}
		else if (firstLineIsURI) { // get lang from the uri in the first line of the markdown
			uri = URI.file(firstLine)
		}
		else {
			uri = null
		}

		if (t.lang) { // a language was provided. empty string is common so check truthy, not just undefined
			language = convertToVscodeLang(languageService, t.lang) // convert markdown language to language that vscode recognizes (eg markdown doesn't know bash but it does know shell)
		}
		else { // no language provided - fallback - get lang from the uri and contents
			language = detectLanguage(languageService, { uri, fileContents: contents })
		}

		if (options.isApplyEnabled && chatMessageLocation) {
			const isCodeblockClosed = t.raw.trimEnd().endsWith('```') // user should only be able to Apply when the code has been closed (t.raw ends with '```')

			const applyBoxId = getApplyBoxId({
				threadId: chatMessageLocation.threadId,
				messageIdx: chatMessageLocation.messageIdx,
				tokenIdx: tokenIdx,
			})
			return <BlockCodeApplyWrapper
				canApply={isCodeblockClosed}
				applyBoxId={applyBoxId}
				codeStr={contents}
				language={language}
				uri={uri || 'current'}
			>
				<BlockCode
					initValue={contents.trimEnd()} // \n\n adds a permanent newline which creates a flash
					language={language}
				/>
			</BlockCodeApplyWrapper>
		}

		return <BlockCode
			initValue={contents}
			language={language}
		/>
	}

	if (t.type === 'heading') {

		const HeadingTag = `h${t.depth}` as keyof JSX.IntrinsicElements

		return <HeadingTag>
			<ChatMarkdownRender chatMessageLocation={chatMessageLocation} string={t.text} inPTag={true} codeURI={codeURI} {...options} />
		</HeadingTag>
	}

	if (t.type === 'table') {
		return (
			<div className="overflow-x-auto my-4 rounded-lg border border-void-border-2">
				<table className="min-w-full border-collapse">
					<thead>
						<tr className="bg-void-bg-2">
							{t.header.map((h, hIdx: number) => (
								<th
									key={hIdx}
									className="px-4 py-3 text-left text-sm font-semibold text-void-fg-1 border-b border-void-border-2"
									style={{ textAlign: (t.align?.[hIdx] as any) || 'left' }}
								>
									<ChatMarkdownRender
										chatMessageLocation={chatMessageLocation}
										string={h.text}
										inPTag={true}
										{...options}
									/>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{t.rows.map((row, rowIdx: number) => (
							<tr
								key={rowIdx}
								className={rowIdx % 2 === 0 ? 'bg-void-bg-1' : 'bg-void-bg-2/50'}
							>
								{row.map((r, rIdx: number) => (
									<td
										key={rIdx}
										className="px-4 py-3 text-sm text-void-fg-2 border-b border-void-border-2"
										style={{ textAlign: (t.align?.[rIdx] as any) || 'left' }}
									>
										<ChatMarkdownRender
											chatMessageLocation={chatMessageLocation}
											string={r.text}
											inPTag={true}
											{...options}
										/>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		)
		// return (
		// 	<div>
		// 		<table className={'min-w-full border border-void-bg-2'}>
		// 			<thead>
		// 				<tr className='bg-void-bg-1'>
		// 					{t.header.map((cell: any, index: number) => (
		// 						<th
		// 							key={index}
		// 							className='px-4 py-2 border border-void-bg-2 font-semibold'
		// 							style={{ textAlign: t.align[index] || 'left' }}
		// 						>
		// 							{cell.raw}
		// 						</th>
		// 					))}
		// 				</tr>
		// 			</thead>
		// 			<tbody>
		// 				{t.rows.map((row: any[], rowIndex: number) => (
		// 					<tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-void-bg-1'}>
		// 						{row.map((cell: any, cellIndex: number) => (
		// 							<td
		// 								key={cellIndex}
		// 								className={'px-4 py-2 border border-void-bg-2'}
		// 								style={{ textAlign: t.align[cellIndex] || 'left' }}
		// 							>
		// 								{cell.raw}
		// 							</td>
		// 						))}
		// 					</tr>
		// 				))}
		// 			</tbody>
		// 		</table>
		// 	</div>
		// )
	}

	if (t.type === 'hr') {
		return <hr />
	}

	if (t.type === 'blockquote') {
		return <blockquote>{t.text}</blockquote>
	}

	if (t.type === 'list_item') {
		return <li>
			<input type='checkbox' checked={t.checked} readOnly />
			<span>
				<ChatMarkdownRender chatMessageLocation={chatMessageLocation} string={t.text} inPTag={true} codeURI={codeURI} {...options} />
			</span>
		</li>
	}

	if (t.type === 'list') {
		const ListTag = t.ordered ? 'ol' : 'ul'

		return (
			<ListTag start={t.start ? t.start : undefined}>
				{t.items.map((item, index) => (
					<li key={index}>
						{item.task && (
							<input type='checkbox' checked={item.checked} readOnly />
						)}
						<span>
							<ChatMarkdownRender chatMessageLocation={chatMessageLocation} string={item.text} inPTag={true} {...options} />
						</span>
					</li>
				))}
			</ListTag>
		)
	}

	if (t.type === 'paragraph') {

		// check for latex
		const latexSegments = paragraphToLatexSegments(t.raw)
		if (latexSegments.length !== 0) {
			if (inPTag) {
				return <span className='block'>{latexSegments}</span>;
			}
			return <p>{latexSegments}</p>;
		}

		// if no latex, default behavior
		const contents = <>
			{t.tokens.map((token, index) => (
				<RenderToken key={index}
					token={token}
					tokenIdx={`${tokenIdx ? `${tokenIdx}-` : ''}${index}`} // assign a unique tokenId to inPTag components
					chatMessageLocation={chatMessageLocation}
					inPTag={true}
					{...options}
				/>
			))}
		</>

		if (inPTag) return <span className='block'>{contents}</span>
		return <p>{contents}</p>
	}

	if (t.type === 'text' || t.type === 'escape' || t.type === 'html') {
		return <span>{t.raw}</span>
	}

	if (t.type === 'def') {
		return <></> // Definitions are typically not rendered
	}

	if (t.type === 'link') {
		return (
			<a
				onClick={() => { window.open(t.href) }}
				href={t.href}
				title={t.title ?? undefined}
				className='underline cursor-pointer hover:brightness-90 transition-all duration-200 text-void-fg-2'
			>
				{t.text}
			</a>
		)
	}

	if (t.type === 'image') {
		return <img
			src={t.href}
			alt={t.text}
			title={t.title ?? undefined}

		/>
	}

	if (t.type === 'strong') {
		return <strong>{t.text}</strong>
	}

	if (t.type === 'em') {
		return <em>{t.text}</em>
	}

	// inline code
	if (t.type === 'codespan') {

		if (options.isLinkDetectionEnabled && chatMessageLocation) {
			return <CodespanWithLink
				text={t.text}
				rawText={t.raw}
				chatMessageLocation={chatMessageLocation}
			/>

		}

		return <Codespan text={t.text} />
	}

	if (t.type === 'br') {
		return <br />
	}

	// strikethrough
	if (t.type === 'del') {
		return <del>{t.text}</del>
	}
	// default
	return (
		<div className='bg-orange-50 rounded-sm overflow-hidden p-2'>
			<span className='text-sm text-orange-500'>Unknown token rendered...</span>
		</div>
	)
}, (prevProps, nextProps) => {
	// Custom comparison function for better React reconciliation during streaming
	// Compare tokens by their content instead of by reference
	const prevToken = prevProps.token as MarkedToken
	const nextToken = nextProps.token as MarkedToken

	// Compare by raw content (the original markdown text)
	if (prevToken.raw !== nextToken.raw) return false

	// Compare type
	if (prevToken.type !== nextToken.type) return false

	// Compare tokenIdx
	if (prevProps.tokenIdx !== nextProps.tokenIdx) return false

	// Compare options
	if (prevProps.isApplyEnabled !== nextProps.isApplyEnabled) return false
	if (prevProps.isLinkDetectionEnabled !== nextProps.isLinkDetectionEnabled) return false

	// Compare chatMessageLocation (if both exist, they should match)
	if (prevProps.chatMessageLocation && nextProps.chatMessageLocation) {
		if (prevProps.chatMessageLocation.threadId !== nextProps.chatMessageLocation.threadId) return false
		if (prevProps.chatMessageLocation.messageIdx !== nextProps.chatMessageLocation.messageIdx) return false
	}

	return true
})


// Helper to detect and fix incomplete markdown during streaming
const preprocessStreamingMarkdown = (text: string): { processedText: string; hasIncompleteCodeBlock: boolean } => {
	// Count code block delimiters
	const codeBlockMatches = text.match(/```/g);
	const codeBlockCount = codeBlockMatches ? codeBlockMatches.length : 0;
	const hasIncompleteCodeBlock = codeBlockCount % 2 !== 0;

	// If there's an incomplete code block, add a closing delimiter
	let processedText = text;
	if (hasIncompleteCodeBlock) {
		processedText = text + '\n```';
	}

	return { processedText, hasIncompleteCodeBlock };
}

// Generate a stable content-based key for a token
// This uses a hash of the token's raw content so that tokens that haven't changed
// maintain the same key across re-renders, preventing React from unmounting/remounting
const generateTokenKey = (token: Token, index: number, prefix: string): string => {
	// Use token.raw for content-based identity (raw contains the original markdown text)
	// Fall back to token.text if raw is not available
	const content = token.raw || (token as any).text || '';

	// Simple hash function for content stability
	let hash = 0;
	for (let i = 0; i < content.length && i < 50; i++) {
		const char = content.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Combine prefix + content hash + type + index for stable identification
	// The prefix ensures different messages don't have colliding keys
	// The content hash ensures tokens with same content get same keys
	// The index is a fallback for uniqueness within the same content
	return `${prefix}-${token.type}-${Math.abs(hash).toString(36)}-${index}`;
}

// Component to render streaming markdown with proper handling of incomplete structures
const StreamingMarkdownRender = ({ string, inPTag, chatMessageLocation, ...options }: { string: string, inPTag?: boolean, chatMessageLocation: ChatMessageLocation | undefined } & RenderTokenOptions) => {
	const { processedText, hasIncompleteCodeBlock } = useMemo(() => preprocessStreamingMarkdown(string), [string]);

	// Use useMemo to cache tokens and prevent unnecessary re-parsing
	// The dependency is the processed text, so we only re-parse when content actually changes
	const tokens = useMemo(() => {
		try {
			return marked.lexer(processedText);
		} catch (e) {
			// If parsing fails, return empty array and fall back to plain text
			console.warn('Markdown parsing error during streaming:', e);
			return [];
		}
	}, [processedText]);

	// If no tokens were parsed, render as plain text
	if (tokens.length === 0) {
		return <span className="whitespace-pre-wrap">{string}</span>;
	}

	// Use a stable prefix based on content length to prevent key collisions
	// between different messages, but use content-based hashing for stability
	// within the same message across streaming updates
	const keyPrefix = useMemo(() => {
		// Create a stable prefix from the first ~20 chars of content
		// This helps maintain key stability across streaming updates
		const firstChars = string.slice(0, 20);
		let hash = 0;
		for (let i = 0; i < firstChars.length; i++) {
			const char = firstChars.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString(36);
	}, []); // Empty deps - compute once per component instance

	return (
		<>
			{tokens.map((token, index) => {
				// Use content-based key for stable React reconciliation
				// This prevents flickering and out-of-order rendering during streaming
				const tokenKey = generateTokenKey(token, index, keyPrefix);

				return <RenderToken
					key={tokenKey}
					token={token}
					inPTag={inPTag}
					chatMessageLocation={chatMessageLocation}
					tokenIdx={index + ''}
					{...options}
				/>
			})}
		</>
	);
}

export const ChatMarkdownRender = ({ string, inPTag = false, chatMessageLocation, isStreaming = false, ...options }: { string: string, inPTag?: boolean, codeURI?: URI, chatMessageLocation: ChatMessageLocation | undefined, isStreaming?: boolean } & RenderTokenOptions) => {
	// Safety check: ensure string is defined
	const safeString = string?.replaceAll('\n•', '\n\n•') || '';

	// During streaming, use streaming-aware markdown rendering
	if (isStreaming) {
		return <StreamingMarkdownRender
			string={safeString}
			inPTag={inPTag}
			chatMessageLocation={chatMessageLocation}
			{...options}
		/>;
	}

	const tokens = useMemo(() => marked.lexer(safeString), [safeString]); // https://marked.js.org/using_pro#renderer
	return (
		<>
			{tokens.map((token, index) => (
				<RenderToken key={index} token={token} inPTag={inPTag} chatMessageLocation={chatMessageLocation} tokenIdx={index + ''} {...options} />
			))}
		</>
	)
}
