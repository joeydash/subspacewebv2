"use client";

import { X, Clock } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/language-store';
import ReactMarkdown from 'react-markdown';


interface Plan {
	id: string;
	plan_name: string;
	display_data: string;
	price: number;
	plan_details: string;
	discounted_price: number;
	duration: string | null;
	duration_type: string | null;
	status: string;
	is_plan: boolean;
	whatsub_order_items: Array<{
		id: string;
		quantity: number;
	}>;
}

interface PlanDetailsModalProps {
	plan: Plan;
	onClose: () => void;
}

const PlanDetailsModal = ({ plan, onClose }: PlanDetailsModalProps) => {
	const discount = Math.round(((plan.price - plan.discounted_price) / plan.price) * 100);
	const { t } = useLanguageStore();

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
			<div className="bg-dark-500 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto small-scrollbar shadow-2xl">
				{/* Header with Gradient */}
				<div className="sticky top-0 bg-linear-to-br from-dark-500 to-dark-400 border-b border-gray-700/50 p-6 md:p-8 flex justify-between items-start backdrop-blur-lg">
					<div className="flex-1">
						<h2 className="text-xl md:text-3xl font-bold mb-4 text-white">{plan.plan_name}</h2>

						{/* Price Section with Badge */}
						<div className="flex flex-wrap items-baseline gap-3">
							<span className="text-3xl md:text-4xl font-bold text-emerald-400">
								₹{plan.discounted_price.toFixed(2)}
							</span>
							{plan.price > plan.discounted_price && (
								<>
									<span className="text-lg md:text-xl text-gray-500 line-through">
										₹{plan.price.toFixed(2)}
									</span>
									<span className="bg-linear-to-r from-emerald-500 to-teal-500 text-white text-sm px-3 py-1.5 rounded-full font-semibold">
										{discount}% {t('common.off')}
									</span>
								</>
							)}
						</div>

						{/* Quick Info - Inline */}
						<div className="flex flex-wrap items-center gap-4 md:gap-6 mt-6 text-sm md:text-base">
							<div className="flex items-center gap-2 text-gray-300">
								<Clock className="h-5 w-5 text-blue-400" />
								<span>
									{plan.duration && plan.duration_type
										? `${plan.duration} ${plan.duration_type}`
										: t('product.lifetime')}
								</span>
							</div>
						</div>
					</div>

					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors shrink-0 ml-4 hover:bg-dark-400 rounded-lg p-2"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 md:p-8">
					{/* Plan Details */}
					{plan.plan_details && (
						<div>
							<h3 className="text-lg md:text-xl font-bold mb-4 text-white">{t('product.planDetails')}</h3>
							<div className="text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
								<ReactMarkdown>
									{plan.plan_details}
								</ReactMarkdown>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PlanDetailsModal;