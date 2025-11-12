'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Globe, Calendar, ChevronDown,  ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Home } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Plan {
	id: string;
	plan_name: string;
	display_data: string;
	price: number;
	is_plan: boolean;
}

interface ServiceDetails {
	id: string;
	image_url: string;
	service_name: string;
	whatsub_plans: Plan[];
}

interface TrackSubscriptionModalProps {
	onClose: () => void;
	serviceDetails: ServiceDetails;
	selectedTrackPlanId: string;
}

const TrackSubscriptionModal: React.FC<TrackSubscriptionModalProps> = ({
	onClose,
	serviceDetails,
	selectedTrackPlanId,
}) => {
	const { user } = useAuthStore();
	const router = useRouter();
	const [selectedPlan, setSelectedPlan] = useState(selectedTrackPlanId);
	const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
	const [isPublic, setIsPublic] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const datePickerRef = useRef<HTMLDivElement>(null);
	const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
	const [errorMessage, setErrorMessage] = useState<string>('');

	const currentPlan = serviceDetails.whatsub_plans.find(plan => plan.id == selectedPlan);

	// Prevent background scroll when modal is open
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, []);

	// Close date picker when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
				setShowDatePicker(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleTrack = async () => {
		if (selectedPlan && expiryDate) {
			if (!user?.id || !user?.auth_token) return;
			
			const selectedPlanDetails = serviceDetails.whatsub_plans.find(plan => plan.id === selectedPlan);
			if (!selectedPlanDetails) {
				console.error('Selected plan not found');
				return;
			}
			
			// Format the expiry date to YYYY-MM-DD format
			const formattedExpiryDate = expiryDate.toISOString().split('T')[0];
			
			setSubmitStatus('submitting');
			setErrorMessage('');
			try {
				const response = await fetch('https://db.subspace.money/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${user.auth_token}`
					},
					body: JSON.stringify({
						query: `
							mutation MyMutation(
								$service_id: uuid
								$expiring_at: date
								$share_limit: Int
								$plan: String
								$plan_id: uuid
								$price: numeric
								$service_image_url: String
								$user_id: uuid
								$service_name: String
								$is_public: Boolean
								$is_assisted: Boolean
								$type: String
							) {
								__typename
								insert_whatsub_users_subscription(
									objects: {
										plan: $plan
										service_id: $service_id
										plan_id: $plan_id
										price: $price
										service_image_url: $service_image_url
										user_id: $user_id
										expiring_at: $expiring_at
										share_limit: $share_limit
										service_name: $service_name
										is_public: $is_public
										is_assisted: $is_assisted
										type: $type
									}
								) {
									__typename
									affected_rows
								}
							}
						`,
						variables: {
							service_id: serviceDetails.id,
							plan: selectedPlanDetails.plan_name,
							plan_id: selectedPlan,
							price: selectedPlanDetails.price,
							service_image_url: serviceDetails.image_url,
							service_name: serviceDetails.service_name,
							user_id: user.id,
							is_public: isPublic,
							is_assisted: false,
							share_limit: 1,
							expiring_at: formattedExpiryDate,
							type: "admin"
						}
					})
				});

				const data = await response.json();
				
				if (data.errors) {
					console.error('Error adding subscription:', data.errors);
					setSubmitStatus('error');
					setErrorMessage(data.errors[0]?.message || 'Failed to add subscription');
					return;
				}
				
				if (data.data?.insert_whatsub_users_subscription?.affected_rows > 0) {
					// Successfully added subscription
					console.log('Subscription added successfully');
					setSubmitStatus('success');
				} else {
					setSubmitStatus('error');
					setErrorMessage('Failed to add subscription');
				}
			} catch (error) {
				console.error('Error adding subscription:', error);
				setSubmitStatus('error');
				setErrorMessage('Network error. Please try again.');
			}
		}
	};

	const handleGoHome = () => {
		router.push('/');
		onClose();
	};

	const handleTryAgain = () => {
		setSubmitStatus('idle');
		setErrorMessage('');
	};
	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const getDaysInMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

	const isDateDisabled = (date: Date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date < today;
	};

	const isSameDay = (date1: Date, date2: Date) => {
		return date1.getDate() === date2.getDate() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getFullYear() === date2.getFullYear();
	};

	const handleDateClick = (day: number) => {
		const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		if (!isDateDisabled(newDate)) {
			setExpiryDate(newDate);
			setShowDatePicker(false);
		}
	};

	const navigateMonth = (direction: 'prev' | 'next') => {
		setCurrentMonth(prev => {
			const newMonth = new Date(prev);
			if (direction === 'prev') {
				newMonth.setMonth(prev.getMonth() - 1);
			} else {
				newMonth.setMonth(prev.getMonth() + 1);
			}
			return newMonth;
		});
	};

	const renderCalendar = () => {
		const daysInMonth = getDaysInMonth(currentMonth);
		const firstDay = getFirstDayOfMonth(currentMonth);
		const days = [];

		// Empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
		}

		// Days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
			const isSelected = isSameDay(date, expiryDate);
			const isDisabled = isDateDisabled(date);
			const isToday = isSameDay(date, new Date());

			days.push(
				<button
					key={day}
					onClick={() => handleDateClick(day)}
					disabled={isDisabled}
					className={`w-8 h-8 text-sm rounded-lg transition-colors ${
						isSelected
							? 'bg-indigo-500 text-white'
							: isToday
							? 'bg-indigo-500/20 text-indigo-400'
							: isDisabled
							? 'text-gray-600 cursor-not-allowed'
							: 'text-gray-300 hover:bg-dark-300'
					}`}
				>
					{day}
				</button>
			);
		}

		return days;
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
			<div className="bg-dark-500 rounded-2xl w-full max-w-md max-h-[90vh] border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
				{/* Header */}
				<div className="p-6 border-b border-gray-700">
					<div className="flex items-center gap-4">
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-white transition-colors"
						>
							<ArrowLeft className="h-6 w-6" />
						</button>
						<h3 className="text-xl font-bold text-white">Track Subscription</h3>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{submitStatus === 'idle' && (
						<>
					{/* Share to Public Toggle */}
					<div 
						className="flex items-center justify-between cursor-pointer hover:bg-dark-400/50 rounded-lg p-1 transition-colors"
						onClick={() => setIsPublic(!isPublic)}
					>
						<div className="flex items-center gap-3">
							<Globe className="h-6 w-6 text-white" />
							<div>
								<div className="font-medium text-white text-lg">Share to Public</div>
								<div className="text-sm text-gray-400">This will allow everyone to see and share your subscription</div>
							</div>
						</div>
						<div className="relative inline-block w-12 h-6 flex-shrink-0">
							<input
								type="checkbox"
								checked={isPublic}
								onChange={(e) => setIsPublic(e.target.checked)}
								className="sr-only"
							/>
							<div
								className={`w-full h-full rounded-full transition-all duration-50 cursor-pointer ${
									isPublic ? 'bg-purple-500' : 'bg-gray-600'
								}`}
							>
								<div
									className={`absolute h-5 w-5 top-0.5 bg-white rounded-full transition-all duration-300 shadow-md ${
										isPublic ? 'left-6' : 'left-0.5'
									}`}
								></div>
							</div>
						</div>
					</div>

					{/* Service Info Section */}
					<div className="space-y-4 py-2">
						{/* Service Info Row */}
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-black p-2">
								{serviceDetails.image_url ? (
									<Image
										src={serviceDetails.image_url}
										alt={serviceDetails.service_name}
										fill
										className="object-contain"
										sizes="64px"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-400">
										{serviceDetails.service_name?.charAt(0)?.toUpperCase()}
									</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="text-xl font-bold text-white truncate">{serviceDetails.service_name}</h3>
								<p className="text-gray-400 truncate">{currentPlan?.plan_name || 'Half Yearly HD Plan'}</p>
							</div>
						</div>
						
						{/* Expiry Date Row */}
						<div className="flex justify-center">
							<div className="relative" ref={datePickerRef}>
								<button
									onClick={() => setShowDatePicker(!showDatePicker)}
									className="flex items-center gap-2 px-4 py-2 bg-dark-400 hover:bg-dark-300 rounded-full text-white text-sm font-medium transition-colors border border-gray-600"
								>
									<span className="whitespace-nowrap">Expiring On {formatDate(expiryDate)}</span>
									<Calendar className="h-4 w-4 flex-shrink-0" />
								</button>
								
								{/* Custom Date Picker Dropdown */}
								{showDatePicker && (
									<div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-dark-400 border border-gray-600 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
										{/* Month Navigation */}
										<div className="flex items-center justify-between mb-4">
											<button
												onClick={() => navigateMonth('prev')}
												className="p-1 hover:bg-dark-300 rounded transition-colors"
											>
												<ChevronLeft className="h-4 w-4 text-gray-400" />
											</button>
											<h3 className="font-medium text-white">
												{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
											</h3>
											<button
												onClick={() => navigateMonth('next')}
												className="p-1 hover:bg-dark-300 rounded transition-colors"
											>
												<ChevronRight className="h-4 w-4 text-gray-400" />
											</button>
										</div>

										{/* Day Headers */}
										<div className="grid grid-cols-7 gap-1 mb-2">
											{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
												<div key={day} className="w-8 h-8 text-xs text-gray-400 flex items-center justify-center">
													{day}
												</div>
											))}
										</div>

										{/* Calendar Grid */}
										<div className="grid grid-cols-7 gap-1">
											{renderCalendar()}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Dotted Separator */}
					<div className="border-t border-dashed border-gray-600"></div>

					{/* Plan Details Section */}
					<div>
						<h4 className="text-gray-400 text-sm mb-4">Plan Details</h4>
						<div className="space-y-4">
							{/* Plan Info - Responsive Layout */}
							<div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
								<div className="flex-1 min-w-0">
									<h3 className="text-xl font-bold text-white mb-1 break-words">
										{currentPlan?.plan_name || 'Half Yearly HD Plan'}
									</h3>
									<div className="text-yellow-400 font-bold text-lg">
										₹ {currentPlan?.price || 299} / half yearly
									</div>
								</div>
								<div className="flex-shrink-0 text-left sm:text-right text-gray-400 text-sm">
									<div>Added date</div>
									<div>{formatDate(new Date())}</div>
								</div>
							</div>
						</div>
					</div>

					{/* Plan Selection */}
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-dark-400 rounded-lg gap-3">
							<div className="flex items-center gap-3 min-w-0">
								<div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center flex-shrink-0">
									<div className="w-3 h-3 bg-orange-400 rounded"></div>
								</div>
								<span className="text-white font-medium">Your Plan</span>
							</div>
							<div className="relative min-w-0 flex-shrink-0">
								<select
									value={selectedPlan}
									onChange={(e) => setSelectedPlan(e.target.value)}
									className="bg-transparent text-white appearance-none pr-6 focus:outline-none min-w-0 max-w-full truncate"
								>
									{serviceDetails.whatsub_plans.map((plan) => (
										<option key={plan.id} value={plan.id} className="bg-dark-400">
											{plan.plan_name}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
							</div>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-dark-400 rounded-lg gap-3">
							<div className="flex items-center gap-3 min-w-0">
								<div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
									<div className="w-3 h-3 bg-green-400 rounded-full"></div>
								</div>
								<span className="text-white font-medium">Plan Price</span>
							</div>
							<div className="text-white font-medium">₹ {currentPlan?.price || 299} / half yearly</div>
						</div>
					</div>
						</>
					)}

					{/* Submitting State */}
					{submitStatus === 'submitting' && (
						<div className="text-center py-8">
							<div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-400"></div>
							</div>
							<h4 className="text-lg font-medium mb-2">Adding Subscription</h4>
							<p className="text-gray-400">Please wait while we add your subscription...</p>
						</div>
					)}

					{/* Success State */}
					{submitStatus === 'success' && (
						<div className="text-center py-8">
							<div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<CheckCircle className="h-10 w-10 text-green-400" />
							</div>
							<h4 className="text-lg font-medium text-green-400 mb-2">Subscription Added!</h4>
							<p className="text-gray-400 mb-6">Your subscription has been successfully added to your tracking list.</p>
							<button
								onClick={handleGoHome}
								className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
							>
								<Home className="h-5 w-5" />
								Go to Home
							</button>
						</div>
					)}

					{/* Error State */}
					{submitStatus === 'error' && (
						<div className="text-center py-8">
							<div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<AlertCircle className="h-10 w-10 text-red-400" />
							</div>
							<h4 className="text-lg font-medium text-red-400 mb-2">Failed to Add Subscription</h4>
							<p className="text-gray-400 mb-6">{errorMessage}</p>
							<div className="space-y-3">
								<button
									onClick={handleTryAgain}
									className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors"
								>
									Try Again
								</button>
								<button
									onClick={onClose}
									className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
								>
									Close
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Add Button */}
				{submitStatus === 'idle' && (
					<div className="p-6 border-t border-gray-700 flex-shrink-0">
						<button
							onClick={handleTrack}
							disabled={!selectedPlan || !expiryDate}
							className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
						>
							<span>Add Subscription</span>
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default TrackSubscriptionModal;