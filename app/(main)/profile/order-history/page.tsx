'use client';

import React, { useState } from 'react';
import { Package, Clock, Copy, CheckCircle, ChevronDown, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import OrderHistorySkeleton from './order-history-skeleton';
import { useOrders } from '@/lib/hooks/orders/use-orders';
import { Order } from '@/lib/api/orders';

const OrderHistoryComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

	const { data: orders = [], isLoading, error, refetch, isRefetching } = useOrders({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});

	const handleCopyCode = async (code: string) => {
		if (!code) return;

		try {
			await navigator.clipboard.writeText(code);
			setCopiedCode(code);
			setTimeout(() => setCopiedCode(null), 2000);
		} catch (error) {
			console.error('Failed to copy code:', error);
		}
	};

	const toggleOrderExpansion = (orderId: string) => {
		setExpandedOrders(prev => {
			const newSet = new Set(prev);
			if (newSet.has(orderId)) {
				newSet.delete(orderId);
			} else {
				newSet.add(orderId);
			}
			return newSet;
		});
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: '2-digit',
			year: 'numeric'
		});
	};

	const formatCurrency = (amount: number) => {
		if (!amount) {
			return 'N/A';
		}

		return `₹${amount.toFixed(2)}`;
	};

	const formatOrderItemName = (order: Order) => {
		if (order.whatsub_service) {
			return order.whatsub_service.service_name;
		}

		const plan = order.whatsub_plan;

		return plan ? plan.whatsub_service.service_name + ' ' + plan.plan_name : 'N/A';
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-3">
							<Package className="h-6 w-6 text-indigo-400" />
							Order History
						</h2>
						<p className="text-gray-400">Your purchase history and voucher codes</p>
					</div>
					<button
						onClick={() => refetch()}
						disabled={isRefetching}
						className="p-2 rounded-lg bg-dark-400 hover:bg-dark-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						title="Refresh orders"
					>
						<RefreshCw className={`h-5 w-5 text-gray-400 ${isRefetching ? 'animate-spin' : ''}`} />
					</button>
				</div>
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
					<p className="text-red-400">{error.message}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-3">
						<Package className="h-6 w-6 text-indigo-400" />
						Order History
					</h2>
					<p className="text-gray-400">Your purchase history and voucher codes</p>
				</div>
				<button
					onClick={() => refetch()}
					disabled={isRefetching}
					className="p-2 rounded-lg bg-dark-400 hover:bg-dark-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					title="Refresh orders"
				>
					<RefreshCw className={`h-5 w-5 text-gray-400 ${isRefetching ? 'animate-spin' : ''}`} />
				</button>
			</div>

			{/* Loading State */}
			{isLoading ? (
				<OrderHistorySkeleton count={5} />
			) : (
				<>
					{/* Orders List */}
					{orders.length === 0 ? (
						<div className="bg-dark-400 rounded-xl p-12 text-center">
							<div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<Package className="h-8 w-8 text-gray-500" />
							</div>
							<h3 className="text-xl font-bold mb-2">No Orders Found</h3>
							<p className="text-gray-400">You haven't made any purchases yet.</p>
						</div>
					) : (
						<div className="space-y-3">
							{orders.map((order) => {
								const isExpanded = expandedOrders.has(order.id);

								return (
									<div key={order.id} className="bg-dark-400 rounded-lg overflow-hidden">
										<div className="p-4">
											{/* Order Header */}
											<div className="flex items-start justify-between mb-3">
												<div className="flex-1">
													<h3 className="text-sm md:text-base font-semibold text-white mb-0.5">
														{formatOrderItemName(order)}
													</h3>
													{order.whatsub_plan && (
														<p className="text-gray-400 text-xs">{order.whatsub_plan.plan_name}</p>
													)}
												</div>
												<div className="text-right ml-3">
													<div className="text-base md:text-lg font-bold text-orange-400">
														{formatCurrency(order.amount)}
													</div>
												</div>
											</div>

											{/* Purchase and Expiry Info */}
											<div className="space-y-1.5 mb-3">
												<div className="flex items-center gap-1.5 text-xs text-gray-400">
													<Package className="h-3.5 w-3.5" />
													<span>Purchased on {formatDate(order.allocated_at)}</span>
												</div>
												<div className="flex items-center gap-1.5 text-xs text-orange-400">
													<Clock className="h-3.5 w-3.5" />
													<span>Expires on {formatDate(order.expiring_at)}</span>
												</div>
											</div>

											{/* Dotted Separator */}
											<div className="border-t border-dashed border-gray-600 my-3"></div>

											{/* Voucher Code Section */}
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<div className="flex-1 bg-dark-500 rounded-lg p-2 md:p-2.5 font-mono text-white text-sm md:text-base tracking-wider">
														{order.coupon}
													</div>
													<button
														onClick={() => handleCopyCode(order.coupon)}
														className="p-2 bg-dark-500 hover:bg-dark-300 rounded-lg transition-colors"
														title="Copy code"
													>
														{copiedCode === order.coupon ? (
															<CheckCircle className="h-4 w-4 text-green-400" />
														) : (
															<Copy className="h-4 w-4 text-gray-400" />
														)}
													</button>
													<button
														onClick={() => toggleOrderExpansion(order.id)}
														className="p-2 bg-dark-500 hover:bg-dark-300 rounded-lg transition-colors"
														title="View details"
													>
														<ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''
															}`} />
													</button>
												</div>

												{/* PIN Section */}
												{order.pin && (
													<div className="flex items-center gap-2">
														<div className="flex-1 bg-dark-500 rounded-lg p-2 md:p-2.5">
															<span className="text-gray-400 text-xs mr-2">PIN:</span>
															<span className="font-mono text-white text-sm md:text-base tracking-wider">{order.pin}</span>
														</div>
														<button
															onClick={() => handleCopyCode(order.pin)}
															className="p-2 bg-dark-500 hover:bg-dark-300 rounded-lg transition-colors"
															title="Copy PIN"
														>
															{copiedCode === order.pin ? (
																<CheckCircle className="h-4 w-4 text-green-400" />
															) : (
																<Copy className="h-4 w-4 text-gray-400" />
															)}
														</button>
													</div>
												)}
											</div>

											{/* Expanded Details */}
											{isExpanded && (
												<div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
													{/* Purchase Date in Green */}
													<div className="text-green-400 text-xs mb-2">
														( Purchased on {formatDate(order.allocated_at)}, {new Date(order.allocated_at).toLocaleTimeString('en-US', {
															hour: '2-digit',
															minute: '2-digit',
															hour12: true
														})} )
													</div>

													{/* Conditions List */}
													{order.avail_conditions && (
														<div className="space-y-2">
															{order.avail_conditions.split('\n').map((condition, index) => {
																const trimmedCondition = condition.trim();
																if (!trimmedCondition) return null;

																return (
																	<div key={index} className="flex items-start gap-2">
																		<p className="text-gray-300 text-xs leading-relaxed flex-1">
																			{trimmedCondition}
																		</p>
																	</div>
																);
															})}
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default OrderHistoryComponent;