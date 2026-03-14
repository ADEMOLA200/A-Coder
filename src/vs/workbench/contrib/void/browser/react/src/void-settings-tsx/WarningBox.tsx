import { AlertTriangle } from 'lucide-react';

export const WarningBox = ({ text, onClick, className }: { text: string; onClick?: () => void; className?: string }) => {

	return (
		<div
			className={`
				flex items-center gap-2 px-3 py-1.5
				bg-orange-500/10 border border-orange-500/20 rounded-lg
				text-orange-500 text-xs font-medium
				${onClick ? 'hover:bg-orange-500/20 transition-all duration-200 cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-h-[44px]' : ''}
				${className}
			`}
			onClick={onClick}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
		>
			<AlertTriangle size={14} className="shrink-0" />
			<span className="truncate">{text}</span>
		</div>
	);
}
