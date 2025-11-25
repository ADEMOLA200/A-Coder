/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IMetricsService } from '../common/metricsService.js';
import { ILiteModeService } from './liteMode.contribution.js';
import { IWebviewWorkbenchService } from '../../../contrib/webviewPanel/browser/webviewWorkbenchService.js';
import { ACTIVE_GROUP } from '../../../services/editor/common/editorService.js';
import { IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';

export class LiteModeService extends Disposable implements ILiteModeService {
    private _webviewPanel: any = null;
    private _isOpen: boolean = false;

    constructor(
        @IMetricsService private readonly _metricsService: IMetricsService,
        @IWebviewWorkbenchService private readonly _webviewWorkbenchService: IWebviewWorkbenchService,
        @IEditorGroupsService private readonly _editorGroupsService: IEditorGroupsService,
        @IWorkbenchLayoutService private readonly _layoutService: IWorkbenchLayoutService,
    ) {
        super();
    }

    async openLiteMode(): Promise<void> {
        if (this._isOpen) {
            return; // Already open
        }

        this._metricsService.capture('Lite Mode', { action: 'open_attempt' });

        try {
            // Get the Lite Mode HTML content
            const liteModeHtml = this._getLiteModeHtml();

            // Create the webview panel
            const webviewInitInfo = {
                providedViewType: 'void-lite-mode',
                title: 'A-Coder Lite Mode',
                options: {
                    retainContextWhenHidden: true,
                    enableScripts: true
                },
                contentOptions: {
                    allowScripts: true,
                    localResourceRoots: []
                },
                extension: undefined
            };

            // Show in the active group (will replace current editor)
            const showOptions = {
                group: ACTIVE_GROUP,
                preserveFocus: false
            };

            const webviewInput = this._webviewWorkbenchService.openWebview(
                webviewInitInfo,
                'void-lite-mode',
                'A-Coder Lite Mode',
                showOptions
            );

            // Access the webview through the webviewInput
            const webview = webviewInput.webview;

            // Set the webview content
            webview.setHtml(liteModeHtml);

            // Maximize the editor to make it feel like a separate window
            // Hide side bar and activity bar for a clean experience
            this._layoutService.setPartHidden(true, Parts.SIDEBAR_PART);
            this._layoutService.setPartHidden(true, Parts.ACTIVITYBAR_PART);
            this._layoutService.setPartHidden(true, Parts.PANEL_PART); // Hide bottom panel
            // Note: Status bar doesn't have a setPartHidden method, keep it visible

            // Maximize the editor group
            const activeGroup = this._editorGroupsService.activeGroup;
            if (activeGroup) {
                // Focus on the active group to make it feel like the main content
                activeGroup.focus();
            }

            // Handle messages from the webview
            webview.onMessage(
                (event: any) => {
                    const message = event.message;
                    switch (message.type) {
                        case 'chatMessage':
                            console.log('Lite Mode received chat message:', message.message);
                            // For now, just echo back a simple response
                            webview.postMessage({
                                type: 'chatResponse',
                                content: `I understand you said: "${message.message}". I'm currently in Lite Mode with basic functionality. Your message has been received!`
                            });
                            break;
                        case 'closeLiteMode':
                            // Restore the original layout when closing
                            this._layoutService.setPartHidden(false, Parts.SIDEBAR_PART);
                            this._layoutService.setPartHidden(false, Parts.ACTIVITYBAR_PART);
                            this._layoutService.setPartHidden(false, Parts.PANEL_PART);
                            webviewInput.dispose();
                            break;
                    }
                },
                undefined,
                this._store
            );

            // Handle panel disposal to restore layout
            this._store.add({
                dispose: () => {
                    if (webviewInput.isDisposed()) {
                        this._isOpen = false;
                        this._webviewPanel = null;
                        this._metricsService.capture('Lite Mode', { action: 'closed' });
                        // Restore the original layout
                        this._layoutService.setPartHidden(false, Parts.SIDEBAR_PART);
                        this._layoutService.setPartHidden(false, Parts.ACTIVITYBAR_PART);
                        this._layoutService.setPartHidden(false, Parts.PANEL_PART);
                    }
                }
            });

            this._webviewPanel = webviewInput;
            this._isOpen = true;

            this._metricsService.capture('Lite Mode', { action: 'open_success' });

        } catch (error) {
            console.error('Failed to open Lite Mode webview:', error);
            // Fallback to alert if webview creation fails
            this._showFallbackAlert();
        }
    }

    private _showFallbackAlert(): void {
        const message = `
A-Coder Lite Mode

This is a simplified interface for non-technical users.

Features:
• Clean, distraction-free chat interface
• Easy access to A-Coder's core functionality
• Simplified controls and options

In a full implementation, this would open as a dedicated panel
with a custom webview interface. For now, this demonstrates that
the Lite Mode button is working correctly.

Click OK to close this message.
            `;

        // Use a simple alert for now
        alert(message.trim());

        this._isOpen = true;
        this._metricsService.capture('Lite Mode', { action: 'open_fallback' });

        // Auto-close after a moment to simulate the temporary nature of the alert
        setTimeout(() => {
            this._isOpen = false;
            this._metricsService.capture('Lite Mode', { action: 'closed' });
        }, 100);
    }

    closeLiteMode(): void {
        if (this._webviewPanel) {
            this._webviewPanel.dispose();
            this._webviewPanel = null;
        }
        this._isOpen = false;
        this._metricsService.capture('Lite Mode', { action: 'closed' });
    }

    isLiteModeOpen(): boolean {
        return this._isOpen;
    }

    private _getLiteModeHtml(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A-Coder Lite Mode</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
            color: #333;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
        }
        .messages {
            flex: 1;
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow-y: auto;
        }
        .message {
            margin-bottom: 10px;
            padding: 8px 12px;
            border-radius: 6px;
        }
        .message.user {
            background: #e3f2fd;
            margin-left: 20px;
        }
        .message.assistant {
            background: #f3e5f5;
            margin-right: 20px;
        }
        .input-area {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .input-group {
            display: flex;
            gap: 10px;
        }
        textarea {
            flex: 1;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px;
            font-family: inherit;
            resize: vertical;
            min-height: 40px;
        }
        button {
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
        }
        button:hover {
            background: #1565c0;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .close-btn {
            background: #dc3545;
            padding: 4px 8px;
            font-size: 12px;
            float: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <button class="close-btn" onclick="closeLiteMode()">✕ Close</button>
        <h1>A-Coder Lite Mode</h1>
        <p>Simplified interface for non-technical users</p>
    </div>

    <div class="messages" id="messages">
        <div class="message assistant">
            Welcome to A-Coder Lite Mode! This is a simplified interface designed to make AI assistance more accessible. How can I help you today?
        </div>
    </div>

    <div class="input-area">
        <div class="input-group">
            <textarea id="messageInput" placeholder="Type your message here..."></textarea>
            <button id="sendButton" onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        // Try to get VS Code API, fallback to mock for testing
        const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : {
            postMessage: (message) => {
                console.log('Mock VS Code API message:', message);
                // Simulate response for testing
                if (message.type === 'chatMessage') {
                    setTimeout(() => {
                        addMessage('assistant', 'This is a mock response. In a real implementation, this would connect to the A-Coder chat service.');
                    }, 500);
                }
            }
        };

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();

            if (message) {
                // Add user message to chat
                addMessage('user', message);

                // Clear input
                input.value = '';

                // Send message to extension
                vscode.postMessage({
                    type: 'chatMessage',
                    message: message
                });

                // Disable send button temporarily
                const sendButton = document.getElementById('sendButton');
                sendButton.disabled = true;
                sendButton.textContent = 'Sending...';

                // Re-enable after a delay
                setTimeout(() => {
                    sendButton.disabled = false;
                    sendButton.textContent = 'Send';
                }, 1000);
            }
        }

        function addMessage(role, content) {
            const messagesContainer = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + role;
            messageDiv.textContent = content;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function closeLiteMode() {
            vscode.postMessage({
                type: 'closeLiteMode'
            });
        }

        // Handle Enter key in textarea
        document.getElementById('messageInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.type) {
                case 'chatResponse':
                    addMessage('assistant', message.content);
                    // Re-enable send button
                    const sendButton = document.getElementById('sendButton');
                    sendButton.disabled = false;
                    sendButton.textContent = 'Send';
                    break;
            }
        });
    </script>
</body>
</html>`;
    }
}
