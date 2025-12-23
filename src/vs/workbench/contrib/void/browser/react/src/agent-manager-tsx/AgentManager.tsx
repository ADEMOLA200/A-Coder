/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useIsDark, useChatThreadsState, useOnAgentManagerOpenFile, useOnAgentManagerOpenWalkthrough, useOnAgentManagerOpenContent, useWorkspaceFolders, useFileContent } from '../util/services.js';
import { SidebarChat } from '../sidebar-tsx/SidebarChat.js';
import { PastThreadsList } from '../sidebar-tsx/SidebarThreadSelector.js';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';
import { Folder, MessageSquare, Code, Settings, X, Maximize2, Minimize2, Search, ExternalLink, Activity, Shield, Cpu, Zap, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { BlockCode } from '../util/inputs.js';
import { URI } from '../../../../../../../base/common/uri.js';
import '../styles.css';

// Hook to track window size
const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

const CodePreview = ({ selectedFileUri }: { selectedFileUri: URI | null }) => {
    const { content, loading } = useFileContent(selectedFileUri);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-void-fg-4 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-void-accent" />
                <span className="text-xs font-medium uppercase tracking-widest opacity-60">Reading Manifest...</span>
            </div>
        );
    }

    if (!content || !selectedFileUri) {
        return (
            <div className="h-full border border-void-border-3 rounded-2xl bg-void-bg-2/50 flex flex-col items-center justify-center text-void-fg-4 gap-6 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--void-fg-1) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="w-20 h-20 rounded-3xl bg-void-bg-3 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Code className="w-10 h-10 opacity-40 text-void-accent" />
                </div>
                <div className="text-center z-10 px-8">
                    <h3 className="text-void-fg-1 font-bold mb-2">Code Analysis Engine</h3>
                    <p className="text-xs opacity-60 leading-relaxed">
                        Select a file from the conversation or explorer to trigger a deep structural analysis and visual preview.
                    </p>
                </div>
            </div>
        );
    }

    const extension = selectedFileUri.fsPath.split('.').pop() || '';

    return (
        <div className="h-full flex flex-col bg-void-bg-3 rounded-xl border border-void-border-3 overflow-hidden shadow-2xl">
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
};

const ContentPreview = ({ title, content }: { title: string, content: string }) => {
    return (
        <div className="h-full flex flex-col bg-void-bg-3 rounded-xl border border-void-border-3 overflow-hidden shadow-2xl">
            <div className="h-10 border-b border-void-border-3 flex items-center px-4 bg-void-bg-2/50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-void-fg-4">{title}</span>
            </div>
            <div className="flex-1 overflow-auto p-4 prose prose-invert prose-sm max-w-none">
                <BlockCode
                    initValue={content}
                    language="markdown"
                    maxHeight={Infinity}
                    showScrollbars={true}
                />
            </div>
        </div>
    );
};

const WorkspacesView = () => {
    const folders = useWorkspaceFolders();

    return (
        <div className="flex flex-col gap-2 p-3">
            {folders.map(folder => (
                <div
                    key={folder.uri.toString()}
                    className="group flex items-center justify-between p-3 rounded-xl bg-void-bg-3 border border-void-border-3 hover:border-void-accent/50 hover:bg-void-bg-4 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-void-bg-1 text-void-accent group-hover:bg-void-accent group-hover:text-white transition-all duration-300">
                            <Folder className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-void-fg-1 truncate">{folder.name}</span>
                            <span className="text-[10px] text-void-fg-4 truncate opacity-60 font-mono">{folder.uri.fsPath}</span>
                        </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-void-fg-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            ))}
            {folders.length === 0 && (
                <div className="p-12 text-center text-void-fg-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-void-bg-3 rounded-full flex items-center justify-center opacity-40">
                        <Folder className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium">No workspaces open</p>
                    <p className="text-xs opacity-60 mt-1">Open a folder in the main window to see it here</p>
                </div>
            )}
        </div>
    );
};

const NavButton = ({ active, onClick, icon: Icon, label, title }: { active: boolean, onClick: () => void, icon: any, label?: string, title: string }) => (
    <button
        onClick={onClick}
        className={`w-full flex flex-col items-center justify-center py-3 px-2 gap-1.5 transition-all duration-300 relative group`}
        title={title}
    >
        <div className={`p-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-void-accent text-white shadow-lg shadow-void-accent/25 scale-110' : 'text-void-fg-4 hover:bg-void-bg-3 hover:text-void-fg-2'}`}>
            <Icon className="w-6 h-6" />
        </div>
        {label && <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-void-accent' : 'text-void-fg-4'}`}>{label}</span>}
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-void-accent rounded-r-full" />}
    </button>
);

export const AgentManager = ({ className }: { className: string }) => {
    const isDark = useIsDark();
    const { width: windowWidth } = useWindowSize();
    const [activeTab, setActiveTab] = useState<'chats' | 'workspaces'>('chats');
    const [showPreview, setShowPreview] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [walkthroughData, setWalkthroughData] = useState<{ filePath: string, preview: string } | null>(null);
    const [contentData, setContentData] = useState<{ title: string, content: string } | null>(null);

    // Auto-collapse sidebar/preview on small screens
    useEffect(() => {
        if (windowWidth < 1024) {
            setShowPreview(false);
        }
        if (windowWidth < 768) {
            setShowSidebar(false);
        }
    }, [windowWidth]);

    const selectedFileUri = useMemo(() => selectedFile ? URI.file(selectedFile) : null, [selectedFile]);

    useOnAgentManagerOpenFile(useCallback((uri) => {
        setSelectedFile(uri.fsPath);
        setWalkthroughData(null);
        setContentData(null);
        setShowPreview(true);
    }, []));

    useOnAgentManagerOpenWalkthrough(useCallback((data) => {
        setWalkthroughData(data);
        setSelectedFile(null);
        setContentData(null);
        setShowPreview(true);
    }, []));

    useOnAgentManagerOpenContent(useCallback((data) => {
        setContentData(data);
        setSelectedFile(null);
        setWalkthroughData(null);
        setShowPreview(true);
    }, []));

    const chatThreadsState = useChatThreadsState();
    const currentThreadId = chatThreadsState.currentThreadId;
    const workspaceFolders = useWorkspaceFolders();

    return (
        <div className={`@@void-scope ${isDark ? 'dark' : ''} fixed inset-0 flex flex-col bg-void-bg-1 text-void-fg-1 overflow-hidden font-sans`}>
            {/* Header */}
            <div className="h-14 border-b border-void-border-2 flex items-center justify-between px-4 md:px-6 flex-shrink-0 bg-void-bg-2/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-void-accent to-void-accent-hover rounded-xl flex items-center justify-center shadow-lg shadow-void-accent/20">
                        <Zap className="text-white w-4 h-4 md:w-5 md:h-5 fill-current" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="font-bold text-xs md:text-sm tracking-tight text-void-fg-1">AGENT MANAGER</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-void-fg-4 uppercase tracking-widest opacity-70">Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6 flex-1 justify-end">
                    <div className="relative group max-w-xs w-full sm:w-64 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-void-fg-4 group-focus-within:text-void-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-void-bg-3 border border-void-border-3 rounded-xl pl-10 pr-4 py-2 text-xs w-full focus:outline-none focus:border-void-accent focus:ring-4 focus:ring-void-accent/10 transition-all placeholder:opacity-50"
                        />
                    </div>
                    <div className="h-8 w-px bg-void-border-3 mx-1 hidden sm:block" />
                    <button className="p-2 md:p-2.5 hover:bg-void-bg-3 rounded-xl transition-all text-void-fg-3 hover:text-void-fg-1 duration-500">
                        <Settings className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative h-full">
                {/* Left Navigation Rail - Hidden on very small screens */}
                <div className="hidden sm:flex w-16 md:w-20 border-r border-void-border-2 flex flex-col items-center py-6 bg-void-bg-2 flex-shrink-0 z-10 h-full">
                    <div className="flex-1 w-full flex flex-col gap-2">
                        <NavButton
                            active={activeTab === 'chats'}
                            onClick={() => { setActiveTab('chats'); setShowSidebar(true); }}
                            icon={MessageSquare}
                            label="Chats"
                            title="Active Conversations"
                        />
                        <NavButton
                            active={activeTab === 'workspaces'}
                            onClick={() => { setActiveTab('workspaces'); setShowSidebar(true); }}
                            icon={Folder}
                            label="Space"
                            title="Workspaces"
                        />
                    </div>

                    <div className="w-full px-2 flex flex-col gap-4 items-center border-t border-void-border-3 pt-6 mt-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-void-bg-3 flex items-center justify-center text-void-fg-4 hover:text-void-accent transition-colors cursor-pointer" title="System Health">
                            <Activity className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-void-bg-3 flex items-center justify-center text-void-fg-4 hover:text-void-accent transition-colors cursor-pointer" title="Security Model">
                            <Shield className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                </div>

                {/* Middle Pane - List/Threads */}
                {showSidebar && (
                    <div className="w-64 md:w-80 border-r border-void-border-2 flex flex-col bg-void-bg-2 flex-shrink-0 shadow-inner absolute inset-y-0 left-0 z-20 md:relative h-full">
                        <div className="p-4 md:p-5 border-b border-void-border-3 bg-void-bg-1/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-void-fg-3">
                                    {activeTab === 'chats' ? 'Threads' : 'Workspaces'}
                                </h2>
                                <span className="px-2 py-0.5 rounded-full bg-void-bg-3 text-[10px] font-bold text-void-fg-4 border border-void-border-3">
                                    {activeTab === 'chats' ? (chatThreadsState.allThreads.length) : (workspaceFolders.length)}
                                </span>
                            </div>
                            <button onClick={() => setShowSidebar(false)} className="md:hidden p-1 hover:bg-void-bg-3 rounded">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <ErrorBoundary>
                                {activeTab === 'chats' ? (
                                    <div className="p-2">
                                        <PastThreadsList />
                                    </div>
                                ) : (
                                    <WorkspacesView />
                                )}
                            </ErrorBoundary>
                        </div>
                    </div>
                )}

                {/* Main Content - Active Chat */}
                <div className="flex-1 flex flex-col bg-void-bg-1 min-w-0 relative h-full overflow-hidden">
                    {!showSidebar && (
                        <button
                            onClick={() => setShowSidebar(true)}
                            className="absolute top-4 left-4 z-10 p-2 bg-void-bg-2 border border-void-border-3 rounded-lg shadow-md hover:bg-void-bg-3 text-void-fg-3 transition-all"
                            title="Show Sidebar"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                    <div className="flex-1 h-full overflow-hidden relative">
                        <ErrorBoundary>
                            <SidebarChat />
                        </ErrorBoundary>
                    </div>
                </div>

                {/* Right Pane - Visual Preview */}
                {showPreview && (
                    <div className="w-full md:w-[400px] lg:w-[500px] border-l border-void-border-2 flex flex-col bg-void-bg-2 flex-shrink-0 shadow-2xl z-30 absolute inset-y-0 right-0 md:relative h-full">
                        <div className="h-14 border-b border-void-border-3 flex items-center justify-between px-4 md:px-6 bg-void-bg-3/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-void-accent/10 flex items-center justify-center text-void-accent">
                                    <Code className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-void-fg-3">Live Preview</span>
                                    <span className="text-xs font-semibold truncate text-void-fg-1">
                                        {selectedFile ? selectedFile.split('/').pop() : walkthroughData ? walkthroughData.filePath.split('/').pop() : contentData ? contentData.title : 'No Preview'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {(selectedFile || walkthroughData) && (
                                    <button className="p-2 hover:bg-void-bg-4 rounded-xl transition-all text-void-fg-4 hover:text-void-accent" title="Open in Main Editor">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        setSelectedFile(null);
                                        setWalkthroughData(null);
                                        setContentData(null);
                                    }}
                                    className="p-2 hover:bg-void-bg-4 rounded-xl transition-all text-void-fg-4 hover:text-void-fg-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden p-4 md:p-6 bg-void-bg-1">
                            <ErrorBoundary>
                                {selectedFileUri ? (
                                    <CodePreview selectedFileUri={selectedFileUri} />
                                ) : walkthroughData ? (
                                    <ContentPreview title="Walkthrough Preview" content={walkthroughData.preview} />
                                ) : contentData ? (
                                    <ContentPreview title={contentData.title} content={contentData.content} />
                                ) : (
                                    <CodePreview selectedFileUri={null} />
                                )}
                            </ErrorBoundary>
                        </div>
                    </div>
                )}

                {/* Floating Preview Toggle */}
                {!showPreview && (
                    <button
                        onClick={() => setShowPreview(true)}
                        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-void-accent to-void-accent-hover text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 z-50 group"
                        title="Show Preview"
                    >
                        <Maximize2 className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-12 transition-transform" />
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-red-500 rounded-full border-2 border-void-bg-1" />
                    </button>
                )}
            </div>
        </div>
    );
};