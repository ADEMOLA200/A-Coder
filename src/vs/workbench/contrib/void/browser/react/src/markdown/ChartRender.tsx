/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useMemo } from 'react';
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	PieChart,
	Pie,
	AreaChart,
	Area,
	ComposedChart,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Cell,
	RadarChart,
	Radar,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	RadialBarChart,
	RadialBar,
	ScatterChart,
	Scatter,
	ZAxis,
} from 'recharts';
import { BarChart3, LineChartIcon, PieChartIcon, Activity, Maximize2, Minimize2 } from 'lucide-react';

// Chart configuration type
export interface ChartConfig {
	type: 'bar' | 'line' | 'pie' | 'area' | 'composed' | 'radar' | 'radial' | 'scatter';
	title?: string;
	data: Record<string, any>[];
	xKey?: string;
	yKeys?: string[];
	colors?: string[];
	showGrid?: boolean;
	showLegend?: boolean;
	showTooltip?: boolean;
	stacked?: boolean;
	smooth?: boolean;
}

// Default colors
const DEFAULT_COLORS = [
	'#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F',
	'#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#8dd1e1'
];

// Parse chart definition from code block
export function parseChartDefinition(code: string): ChartConfig | null {
	try {
		// Try to parse as JSON config
		if (code.trim().startsWith('{')) {
			return JSON.parse(code);
		}

		// Parse simple chart syntax
		// Format: chart-type\nxKey:key\n[yKeys:key1,key2]\ndata:json
		const lines = code.split('\n');
		const config: Partial<ChartConfig> = { data: [] };
		let dataStarted = false;
		let dataLines: string[] = [];

		for (const line of lines) {
			const trimmedLine = line.trim();

			if (dataStarted) {
				dataLines.push(line);
				continue;
			}

			if (trimmedLine.startsWith('type:')) {
				config.type = trimmedLine.slice(5).trim() as ChartConfig['type'];
			} else if (trimmedLine.startsWith('title:')) {
				config.title = trimmedLine.slice(6).trim();
			} else if (trimmedLine.startsWith('xKey:')) {
				config.xKey = trimmedLine.slice(5).trim();
			} else if (trimmedLine.startsWith('yKeys:')) {
				config.yKeys = trimmedLine.slice(6).trim().split(',').map(k => k.trim());
			} else if (trimmedLine.startsWith('colors:')) {
				config.colors = trimmedLine.slice(7).trim().split(',').map(c => c.trim());
			} else if (trimmedLine.startsWith('stacked:')) {
				config.stacked = trimmedLine.slice(8).trim() === 'true';
			} else if (trimmedLine.startsWith('smooth:')) {
				config.smooth = trimmedLine.slice(7).trim() === 'true';
			} else if (trimmedLine.startsWith('data:')) {
				dataStarted = true;
				const dataContent = trimmedLine.slice(5).trim();
				if (dataContent) {
					dataLines.push(dataContent);
				}
			}
		}

		// Parse data from collected lines
		if (dataLines.length > 0) {
			const dataStr = dataLines.join('\n').trim();
			try {
				config.data = JSON.parse(dataStr);
			} catch {
				// Try to parse as simple key=value format
				config.data = dataLines.map(line => {
					const parts = line.split(',').map(p => p.trim());
					const obj: Record<string, any> = {};
					for (const part of parts) {
						const [key, value] = part.split(':').map(p => p.trim());
						if (key && value) {
							obj[key] = isNaN(Number(value)) ? value : Number(value);
						}
					}
					return obj;
				});
			}
		}

		// Set defaults
		config.showGrid = config.showGrid !== false;
		config.showLegend = config.showLegend !== false;
		config.showTooltip = config.showTooltip !== false;
		config.colors = config.colors || DEFAULT_COLORS;

		return config as ChartConfig;
	} catch (err) {
		console.error('Failed to parse chart config:', err);
		return null;
	}
}

// Chart icon component
const ChartIcon: React.FC<{ type: string }> = ({ type }) => {
	switch (type) {
		case 'bar':
			return <BarChart3 size={16} className="text-blue-400" />;
		case 'line':
			return <LineChartIcon size={16} className="text-green-400" />;
		case 'pie':
		case 'radial':
			return <PieChartIcon size={16} className="text-purple-400" />;
		case 'area':
			return <Activity size={16} className="text-cyan-400" />;
		case 'radar':
			return <Activity size={16} className="text-orange-400" />;
		case 'scatter':
			return <Activity size={16} className="text-pink-400" />;
		default:
			return <BarChart3 size={16} className="text-void-fg-3" />;
	}
};

export interface ChartRenderProps {
	config: ChartConfig;
	className?: string;
}

export const ChartRender: React.FC<ChartRenderProps> = ({ config, className = '' }) => {
	const [isFullscreen, setIsFullscreen] = React.useState(false);
	const colors = config.colors || DEFAULT_COLORS;
	const xKey = config.xKey || 'name';
	const yKeys = config.yKeys || Object.keys(config.data[0] || {}).filter(k => k !== xKey);

	// Memoize the chart to prevent unnecessary re-renders
	const chart = useMemo(() => {
		const commonProps = {
			data: config.data,
			margin: { top: 20, right: 30, left: 20, bottom: 5 },
		};

		const axisComponents = config.showGrid !== false ? (
			<>
				<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
				<XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#374151' }} />
				<YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#374151' }} />
			</>
		) : (
			<>
				<XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#374151' }} />
				<YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#374151' }} />
			</>
		);

		const tooltipLegend = (
			<>
				{config.showTooltip !== false && (
					<Tooltip
						contentStyle={{
							backgroundColor: '#1f2937',
							border: '1px solid #374151',
							borderRadius: '8px',
							color: '#f3f4f6',
						}}
					/>
				)}
				{config.showLegend !== false && (
					<Legend wrapperStyle={{ color: '#9ca3af' }} />
				)}
			</>
		);

		switch (config.type) {
			case 'bar':
				return (
					<BarChart {...commonProps}>
						{axisComponents}
						{tooltipLegend}
						{yKeys.map((key, index) => (
							<Bar
								key={key}
								dataKey={key}
								fill={colors[index % colors.length]}
								stackId={config.stacked ? 'stack' : undefined}
								radius={[4, 4, 0, 0]}
							/>
						))}
					</BarChart>
				);

			case 'line':
				return (
					<LineChart {...commonProps}>
						{axisComponents}
						{tooltipLegend}
						{yKeys.map((key, index) => (
							<Line
								key={key}
								type={config.smooth ? 'monotone' : 'linear'}
								dataKey={key}
								stroke={colors[index % colors.length]}
								strokeWidth={2}
								dot={{ fill: colors[index % colors.length], strokeWidth: 2 }}
								activeDot={{ r: 6, strokeWidth: 2 }}
							/>
						))}
					</LineChart>
				);

			case 'area':
				return (
					<AreaChart {...commonProps}>
						{axisComponents}
						{tooltipLegend}
						{yKeys.map((key, index) => (
							<Area
								key={key}
								type={config.smooth ? 'monotone' : 'linear'}
								dataKey={key}
								stroke={colors[index % colors.length]}
								fill={colors[index % colors.length]}
								fillOpacity={0.3}
							/>
						))}
					</AreaChart>
				);

			case 'pie': {
				const pieData = config.data.map((item, index) => ({
					name: item[xKey],
					value: item[yKeys[0]] || Object.values(item)[1],
					fill: colors[index % colors.length],
				}));

				return (
					<PieChart>
						<Pie
							data={pieData}
							cx="50%"
							cy="50%"
							labelLine={true}
							label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
							outerRadius={120}
							dataKey="value"
						>
							{pieData.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={entry.fill} />
							))}
						</Pie>
						{config.showTooltip !== false && (
							<Tooltip
								contentStyle={{
									backgroundColor: '#1f2937',
									border: '1px solid #374151',
									borderRadius: '8px',
									color: '#f3f4f6',
								}}
							/>
						)}
						{config.showLegend !== false && <Legend wrapperStyle={{ color: '#9ca3af' }} />}
					</PieChart>
				);
			}

			case 'composed':
				return (
					<ComposedChart {...commonProps}>
						{axisComponents}
						{tooltipLegend}
						{yKeys.map((key, index) => {
							const type = index === 0 ? 'area' : index === 1 ? 'bar' : 'line';
							if (type === 'area') {
								return (
									<Area
										key={key}
										type="monotone"
										dataKey={key}
										fill={colors[index % colors.length]}
										stroke={colors[index % colors.length]}
										fillOpacity={0.3}
									/>
								);
							} else if (type === 'bar') {
								return (
									<Bar
										key={key}
										dataKey={key}
										fill={colors[index % colors.length]}
										barSize={20}
										radius={[4, 4, 0, 0]}
									/>
								);
							} else {
								return (
									<Line
										key={key}
										type="monotone"
										dataKey={key}
										stroke={colors[index % colors.length]}
										strokeWidth={2}
									/>
								);
							}
						})}
					</ComposedChart>
				);

			case 'radar': {
				const radarData = config.data.map(item => ({
					subject: item[xKey],
					...Object.fromEntries(yKeys.map(k => [k, item[k]])),
				}));

				return (
					<RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
						<PolarGrid stroke="#374151" />
						<PolarAngleAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 11 }} />
						<PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
						{yKeys.map((key, index) => (
							<Radar
								key={key}
								name={key}
								dataKey={key}
								stroke={colors[index % colors.length]}
								fill={colors[index % colors.length]}
								fillOpacity={0.3}
							/>
						))}
						{config.showTooltip !== false && <Tooltip />}
						{config.showLegend !== false && <Legend wrapperStyle={{ color: '#9ca3af' }} />}
					</RadarChart>
				);
			}

			case 'radial': {
				const radialData = config.data.map((item, index) => ({
					name: item[xKey],
					value: item[yKeys[0]] || 100,
					fill: colors[index % colors.length],
				}));

				return (
					<RadialBarChart
						cx="50%"
						cy="50%"
						innerRadius="10%"
						outerRadius="90%"
						data={radialData}
						startAngle={180}
						endAngle={0}
					>
						<RadialBar
							background
							dataKey="value"
							cornerRadius={10}
						/>
						{config.showLegend !== false && <Legend wrapperStyle={{ color: '#9ca3af' }} />}
					</RadialBarChart>
				);
			}

			case 'scatter': {
				const scatterData = config.data.map(item => ({
					x: item[xKey] || item.x,
					y: item[yKeys[0]] || item.y,
				}));

				return (
					<ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
						<XAxis dataKey="x" type="number" name={xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} />
						<YAxis dataKey="y" type="number" name={yKeys[0]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
						<ZAxis range={[60, 400]} />
						{config.showTooltip !== false && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
						{config.showLegend !== false && <Legend />}
						<Scatter name="Data" data={scatterData} fill={colors[0]}>
							{scatterData.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
							))}
						</Scatter>
					</ScatterChart>
				);
			}

			default:
				return null;
		}
	}, [config, colors, xKey, yKeys]);

	if (!config.data || config.data.length === 0) {
		return (
			<div className={`border border-void-border-2 rounded-lg p-4 bg-void-bg-2 ${className}`}>
				<p className="text-void-fg-3 text-sm">No chart data available</p>
			</div>
		);
	}

	return (
		<div className={`relative ${className}`}>
			{/* Header toolbar */}
			<div className="flex items-center justify-between px-3 py-2 bg-void-bg-2 border border-void-border-2 rounded-t-lg">
				<div className="flex items-center gap-2">
					<ChartIcon type={config.type} />
					<span className="text-sm font-medium text-void-fg-1 capitalize">{config.type} Chart</span>
					{config.title && (
						<span className="text-xs text-void-fg-3">- {config.title}</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					<button
						onClick={() => setIsFullscreen(!isFullscreen)}
						className="p-1.5 hover:bg-void-bg-3 rounded-lg transition-colors"
						title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
					>
						{isFullscreen ? <Minimize2 size={14} className="text-void-fg-3" /> : <Maximize2 size={14} className="text-void-fg-3" />}
					</button>
				</div>
			</div>

			{/* Chart container */}
			<div
				className={`
					bg-gradient-to-br from-void-bg-4 to-void-bg-3 border-l border-r border-b border-void-border-2
					${isFullscreen ? 'fixed inset-4 z-50 rounded-xl shadow-2xl' : 'rounded-b-lg'}
					transition-all duration-200
				`}
			>
				<ResponsiveContainer width="100%" height={isFullscreen ? '100%' : 350}>
					{chart}
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default ChartRender;