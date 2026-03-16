/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Target, BookOpen, TrendingUp, Clock, Flame, Star, ChevronRight, X, Award, Zap, Calendar, BarChart3, CheckCircle2, Brain, Map, Layout, Layers } from 'lucide-react';
import { useAccessor, useChatThreadsState } from '../util/services.js';
import { ILearningProgressService } from '../../../../common/learningProgressService.js';

interface LearningDashboardProps {
	threadId: string;
	onClose: () => void;
}

// Tab content type
type DashboardTab = 'overview' | 'concepts' | 'quizzes' | 'badges';

// Skill Tree Node Placeholder
const SkillNode = ({ name, level, color }: { name: string, level: number, color: string }) => (
	<div className="flex flex-col items-center gap-2 p-4 bg-void-bg-2 rounded-2xl border border-void-border-2 w-32 relative group hover:border-void-accent transition-all cursor-default">
		<div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${color} shadow-lg shadow-void-bg-1`}>
			<Brain size={20} className="text-white" />
		</div>
		<span className="text-[10px] font-bold uppercase tracking-wider text-void-fg-3">{name}</span>
		<div className="flex gap-0.5">
			{[1, 2, 3, 4, 5].map(i => (
				<div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-void-accent' : 'bg-void-bg-3'}`} />
			))}
		</div>
	</div>
);

export const LearningDashboard: React.FC<LearningDashboardProps> = ({ threadId, onClose }) => {
	const accessor = useAccessor();
	const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
	const [stats, setStats] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	const learningProgressService = accessor.get('ILearningProgressService');

	// Load progress data from Service
	useEffect(() => {
		const updateData = () => {
			const globalStats = learningProgressService.getGlobalStats();
			const threadProgress = learningProgressService.getThreadProgress(threadId);
			setStats({ global: globalStats, thread: threadProgress });
			setLoading(false);
		};

		updateData();
		// Subscribe to changes
		const disposable = learningProgressService.onDidChangeState(() => updateData());
		return () => disposable.dispose();
	}, [threadId, learningProgressService]);

	const formatTime = (ms: number): string => {
		const minutes = Math.floor(ms / 60000);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
	};

	if (loading) return null;

	const global = stats?.global;
	const thread = stats?.thread;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
			<div className="bg-void-bg-1 border border-void-border-2 rounded-[32px] shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

				{/* Sidebar-style Header */}
				<div className="flex h-full">
					{/* Left Nav */}
					<div className="w-64 bg-void-bg-2 border-r border-void-border-2 flex flex-col p-6">
						<div className="flex items-center gap-3 mb-10 px-2">
							<div className="p-2.5 rounded-2xl bg-void-accent shadow-lg shadow-void-accent/20 text-white">
								<Layers size={22} />
							</div>
							<div>
								<h2 className="text-base font-black text-void-fg-1 tracking-tight">Academy</h2>
								<p className="text-[10px] font-bold text-void-accent uppercase tracking-widest">Student Mode</p>
							</div>
						</div>

						<nav className="flex-1 space-y-1">
							{(['overview', 'concepts', 'quizzes', 'badges'] as DashboardTab[]).map((tab) => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
										activeTab === tab
											? 'bg-void-accent text-white shadow-lg shadow-void-accent/20'
											: 'text-void-fg-3 hover:text-void-fg-1 hover:bg-void-bg-3'
									}`}
								>
									{tab === 'overview' && <Layout size={18} />}
									{tab === 'concepts' && <Map size={18} />}
									{tab === 'quizzes' && <Zap size={18} />}
									{tab === 'badges' && <Star size={18} />}
									<span className="capitalize">{tab}</span>
								</button>
							))}
						</nav>

						<div className="mt-auto p-4 bg-void-bg-3/50 rounded-2xl border border-void-border-2">
							<div className="flex items-center gap-2 mb-2">
								<Flame size={16} className="text-orange-500" />
								<span className="text-[10px] font-black uppercase text-void-fg-3 tracking-tighter">Current Streak</span>
							</div>
							<div className="text-xl font-black text-void-fg-1">{global?.currentStreak || 0} Days</div>
						</div>
					</div>

					{/* Main Content Area */}
					<div className="flex-1 flex flex-col bg-void-bg-1">
						{/* Top Bar */}
						<div className="h-20 px-8 flex items-center justify-between border-b border-void-border-2 bg-void-bg-1/50 backdrop-blur-md sticky top-0 z-10">
							<h3 className="text-lg font-black text-void-fg-1 capitalize tracking-tight">{activeTab}</h3>
							<button onClick={onClose} className="p-2.5 hover:bg-void-bg-2 rounded-xl text-void-fg-4 hover:text-void-fg-1 transition-all active:scale-90">
								<X size={20} />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto p-10">
							{activeTab === 'overview' && (
								<div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
									{/* Hero Stats */}
									<div className="grid grid-cols-3 gap-6">
										<div className="p-8 bg-gradient-to-br from-void-accent/10 to-transparent rounded-[24px] border border-void-accent/20 relative overflow-hidden group">
											<div className="absolute -right-4 -top-4 text-void-accent/5 group-hover:scale-110 transition-transform duration-700">
												<Trophy size={120} />
											</div>
											<p className="text-[11px] font-bold text-void-accent uppercase tracking-widest mb-1">Lessons Done</p>
											<h4 className="text-4xl font-black text-void-fg-1">{global?.totalLessonsCompleted || 0}</h4>
										</div>
										<div className="p-8 bg-void-bg-2 rounded-[24px] border border-void-border-2">
											<p className="text-[11px] font-bold text-void-fg-4 uppercase tracking-widest mb-1">XP Points</p>
											<h4 className="text-4xl font-black text-void-fg-1">{(global?.totalExercisesSolved || 0) * 50}</h4>
										</div>
										<div className="p-8 bg-void-bg-2 rounded-[24px] border border-void-border-2">
											<p className="text-[11px] font-bold text-void-fg-4 uppercase tracking-widest mb-1">Learning Time</p>
											<h4 className="text-4xl font-black text-void-fg-1">{formatTime(global?.totalTimeSpent || 0)}</h4>
										</div>
									</div>

									{/* Recent Activity */}
									<div>
										<h4 className="text-xs font-black text-void-fg-3 uppercase tracking-[0.2em] mb-6">Recent Activity</h4>
										<div className="bg-void-bg-2/50 rounded-[24px] border border-void-border-2 overflow-hidden shadow-inner">
											{thread?.quizzes.length ? (
												thread.quizzes.slice(-3).map((quiz: any, i: number) => (
													<div key={i} className="px-8 py-6 flex items-center justify-between border-b border-void-border-2 last:border-0 hover:bg-void-bg-3/30 transition-colors">
														<div className="flex items-center gap-4">
															<div className="w-12 h-12 rounded-2xl bg-void-accent/10 flex items-center justify-center text-void-accent">
																<CheckCircle2 size={20} />
															</div>
															<div>
																<p className="text-sm font-bold text-void-fg-1">Quiz Completed</p>
																<p className="text-xs text-void-fg-4">Score: {quiz.score}%</p>
															</div>
														</div>
														<span className="text-[10px] font-bold text-void-fg-4 uppercase">{new Date(quiz.completedAt).toLocaleDateString()}</span>
													</div>
												))
											) : (
												<div className="p-12 text-center">
													<Brain size={40} className="mx-auto mb-4 text-void-fg-4 opacity-20" />
													<p className="text-sm text-void-fg-3 font-medium italic">No activity yet. Start a lesson to track your progress!</p>
												</div>
											)}
										</div>
									</div>
								</div>
							)}

							{activeTab === 'concepts' && (
								<div className="animate-in fade-in duration-500">
									<div className="mb-8">
										<h4 className="text-xs font-black text-void-fg-3 uppercase tracking-[0.2em] mb-2">Mastery Skill Tree</h4>
										<p className="text-sm text-void-fg-4 font-medium italic">Visualize your technical growth across different domains.</p>
									</div>
									<div className="relative flex flex-wrap justify-center gap-12 py-10">
										{/* Simple Skill Tree Visualization */}
										<SkillNode name="React" level={4} color="border-blue-500" />
										<SkillNode name="TypeScript" level={3} color="border-cyan-500" />
										<SkillNode name="Node.js" level={2} color="border-green-500" />
										<SkillNode name="CSS/Tailwind" level={5} color="border-pink-500" />
										<SkillNode name="Python" level={1} color="border-yellow-500" />

										{/* Connection Lines (Pseudo) */}
										<div className="absolute top-1/2 left-0 right-0 h-px bg-void-border-2 -z-10" />
									</div>
								</div>
							)}

							{activeTab === 'quizzes' && (
								<div className="text-center py-20 animate-in zoom-in-95 duration-500">
									<Zap size={48} className="mx-auto mb-6 text-void-fg-4 opacity-20" />
									<h4 className="text-xl font-black text-void-fg-1 mb-2 tracking-tight">Review Sessions</h4>
									<p className="text-sm text-void-fg-3 max-w-xs mx-auto">Use spaced repetition to cement what you've learned. New quizzes will appear here automatically.</p>
								</div>
							)}

							{activeTab === 'badges' && (
								<div className="grid grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
									{[
										{ id: '1', name: 'Code Ninja', desc: 'Solved 10 exercises', earned: true, icon: '🥷' },
										{ id: '2', name: 'Speed Demon', desc: 'Finish lesson in < 5m', earned: true, icon: '⚡' },
										{ id: '3', name: 'Polyglot', desc: 'Learn 3 languages', earned: false, icon: '🌐' },
									].map(badge => (
										<div key={badge.id} className={`p-8 rounded-[32px] border flex flex-col items-center text-center transition-all ${badge.earned ? 'bg-void-bg-2 border-void-accent/30 shadow-xl shadow-void-accent/5' : 'bg-void-bg-1 border-void-border-2 opacity-40 grayscale'}`}>
											<div className="text-5xl mb-4">{badge.icon}</div>
											<h5 className="text-sm font-black text-void-fg-1 mb-1">{badge.name}</h5>
											<p className="text-[10px] font-bold text-void-fg-4 uppercase tracking-widest">{badge.desc}</p>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LearningDashboard;