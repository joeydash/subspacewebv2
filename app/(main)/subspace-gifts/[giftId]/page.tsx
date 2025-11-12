'use client';


import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Gift, CheckCircle, Star, Trophy, Coins, Award, Info, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import ProtectedRoute from '@/components/protected-route';

interface GiftDetail {
	type: string;
	tnc: string;
	options: any;
	is_claimed: boolean;
	value: number;
	win_conditions: string;
	win_details_data: any;
	win_image: string;
	win_text: string;
}

const SubspaceGiftPage = () => {
	const params = useParams();
	const giftId = params?.giftId as string;
	const { user } = useAuthStore();
	const [giftDetail, setGiftDetail] = useState<GiftDetail | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showTerms, setShowTerms] = useState(false);

	useEffect(() => {
		if (giftId && user?.id && user?.auth_token) {
			fetchGiftDetail();
		}
	}, [giftId, user?.id, user?.auth_token]);

	const fetchGiftDetail = async () => {
		if (!giftId || !user?.id || !user?.auth_token) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query MyQuery($gift_id: uuid = "") {
              __typename
              whatsub_gifts(where: {id: {_eq: $gift_id}}) {
                __typename
                type
                tnc
                options
                is_claimed
                value
                win_conditions
                win_details_data
                win_image
                win_text
              }
            }
          `,
					variables: {
						gift_id: giftId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to fetch gift details');
				return;
			}

			const gift = data.data?.whatsub_gifts?.[0];
			if (!gift) {
				setError('Gift not found');
				return;
			}

			setGiftDetail(gift);
		} catch (error) {
			console.error('Error fetching gift details:', error);
			setError('Failed to fetch gift details');
		} finally {
			setIsLoading(false);
		}
	};

	const getGiftIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case 'coins':
				return <Coins className="h-8 w-8 text-yellow-400" />;
			case 'trophy':
				return <Trophy className="h-8 w-8 text-yellow-400" />;
			case 'star':
				return <Star className="h-8 w-8 text-yellow-400" />;
			case 'award':
				return <Award className="h-8 w-8 text-yellow-400" />;
			default:
				return <Gift className="h-8 w-8 text-yellow-400" />;
		}
	};

	const getGiftTypeColor = (type: string) => {
		switch (type.toLowerCase()) {
			case 'coins':
				return {
					gradient: 'from-yellow-500/20 to-orange-500/20',
					border: 'border-yellow-500/30',
					text: 'text-yellow-400',
					bg: 'bg-yellow-500/20'
				};
			case 'trophy':
				return {
					gradient: 'from-purple-500/20 to-pink-500/20',
					border: 'border-purple-500/30',
					text: 'text-purple-400',
					bg: 'bg-purple-500/20'
				};
			case 'star':
				return {
					gradient: 'from-blue-500/20 to-indigo-500/20',
					border: 'border-blue-500/30',
					text: 'text-blue-400',
					bg: 'bg-blue-500/20'
				};
			default:
				return {
					gradient: 'from-green-500/20 to-emerald-500/20',
					border: 'border-green-500/30',
					text: 'text-green-400',
					bg: 'bg-green-500/20'
				};
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const parseWinDetailsData = (data: any) => {
		if (typeof data === 'string') {
			try {
				return JSON.parse(data);
			} catch {
				return null;
			}
		}
		return data;
	};

	if (isLoading) {
		return (
			<div className="page-container pt-24">
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
				</div>
			</div>
		);
	}

	if (error || !giftDetail) {
		return (
			<div className="page-container pt-24">
				<div className="flex items-center gap-4 mb-8">
					<Link href="/subspace-gifts" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
						<ArrowLeft className="h-6 w-6" />
					</Link>
				</div>
				<div className="bg-dark-500 rounded-xl p-12 text-center">
					<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<Gift className="h-8 w-8 text-red-400" />
					</div>
					<h1 className="text-2xl font-bold mb-4">Gift Not Found</h1>
					<p className="text-gray-400 mb-6">{error || 'The gift you\'re looking for doesn\'t exist.'}</p>
					<Link href="/subspace-gifts" className="btn btn-primary">
						Back to Gifts
					</Link>
				</div>
			</div>
		);
	}

	const colors = getGiftTypeColor(giftDetail.type);
	const winDetails = parseWinDetailsData(giftDetail.win_details_data);

	return (
		<div className="page-container pt-24">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<Link href="/subspace-gifts" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
					<ArrowLeft className="h-6 w-6" />
				</Link>
				<div className="flex-1">
					<h1 className="text-3xl font-bold">Gift Details</h1>
					<p className="text-gray-400">View your gift information and details</p>
				</div>
			</div>

			{/* Main Gift Card */}
			<div className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-2xl p-8 mb-8`}>
				<div className="flex flex-col lg:flex-row items-center gap-8">
					{/* Gift Image/Icon */}
					<div className="flex-shrink-0">
						{giftDetail.win_image ? (
							<div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/10 p-4 relative">
								<Image
									src={giftDetail.win_image}
									alt="Gift"
									fill
									className="object-contain"
									sizes="128px"
								/>
							</div>
						) : (
							<div className={`w-32 h-32 ${colors.bg} rounded-2xl flex items-center justify-center`}>
								{getGiftIcon(giftDetail.type)}
							</div>
						)}
					</div>

					{/* Gift Info */}
					<div className="flex-1 text-center lg:text-left">
						<div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
							<h2 className="text-3xl font-bold">{giftDetail.win_text}</h2>
							{giftDetail.is_claimed && (
								<div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
									<CheckCircle className="h-4 w-4" />
									Claimed
								</div>
							)}
						</div>

						<div className="mb-6">
							<div className={`text-5xl font-bold ${colors.text} mb-2 flex items-center justify-center gap-3`}>
								<Image src="/coin.svg" alt="Coin" width={48} height={48} className="w-12 h-12" />
								<span>{giftDetail.value}</span>
							</div>
							<div className="text-gray-300 text-lg capitalize">
								{giftDetail.type} Gift
							</div>
						</div>

						{/* Status Badge */}
						<div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${giftDetail.is_claimed
								? 'bg-green-500/20 text-green-400'
								: 'bg-orange-500/20 text-orange-400'
							}`}>
							{giftDetail.is_claimed ? (
								<>
									<CheckCircle className="h-5 w-5" />
									<span className="font-medium">Successfully Claimed</span>
								</>
							) : (
								<>
									<Gift className="h-5 w-5" />
									<span className="font-medium">Ready to Claim</span>
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Details Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				{/* Win Conditions */}
				{giftDetail.win_conditions && (
					<div className="bg-dark-500 rounded-xl p-6">
						<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
							<Info className="h-5 w-5 text-blue-400" />
							Win Conditions
						</h3>
						<div className="bg-dark-400 rounded-lg p-4">
							<p className="text-gray-300 leading-relaxed">{giftDetail.win_conditions}</p>
						</div>
					</div>
				)}

				{/* Gift Options */}
				{giftDetail.options && (
					<div className="bg-dark-500 rounded-xl p-6">
						<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
							<Award className="h-5 w-5 text-purple-400" />
							Gift Options
						</h3>
						<div className="bg-dark-400 rounded-lg p-4">
							<pre className="text-gray-300 text-sm whitespace-pre-wrap overflow-x-auto">
								{typeof giftDetail.options === 'string'
									? giftDetail.options
									: JSON.stringify(giftDetail.options, null, 2)
								}
							</pre>
						</div>
					</div>
				)}

				{/* Gift Type Info */}
				<div className="bg-dark-500 rounded-xl p-6">
					<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
						{getGiftIcon(giftDetail.type)}
						Gift Information
					</h3>
					<div className="space-y-4">
						<div className="flex justify-between items-center py-2 border-b border-gray-700">
							<span className="text-gray-400">Type</span>
							<span className={`font-medium ${colors.text} capitalize`}>{giftDetail.type}</span>
						</div>
						<div className="flex justify-between items-center py-2 border-b border-gray-700">
							<span className="text-gray-400">Value</span>
							<span className="font-medium flex items-center gap-2">
								<Image src="/coin.svg" alt="Coin" width={16} height={16} className="w-4 h-4" />
								{giftDetail.value}
							</span>
						</div>
						<div className="flex justify-between items-center py-2 border-b border-gray-700">
							<span className="text-gray-400">Status</span>
							<span className={`font-medium ${giftDetail.is_claimed ? 'text-green-400' : 'text-orange-400'
								}`}>
								{giftDetail.is_claimed ? 'Claimed' : 'Unclaimed'}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Terms and Conditions */}
			{giftDetail.tnc && (
				<div className="bg-dark-500 rounded-xl p-6 mb-8">
					<button
						onClick={() => setShowTerms(!showTerms)}
						className="flex items-center justify-between w-full text-left group"
					>
						<h3 className="text-xl font-bold flex items-center gap-2">
							<Info className="h-5 w-5 text-blue-400" />
							Terms & Conditions
						</h3>
						<div className={`transform transition-transform duration-200 ${showTerms ? 'rotate-180' : ''}`}>
							<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
							</svg>
						</div>
					</button>

					{showTerms && (
						<div className="mt-4 bg-dark-400 rounded-lg p-4">
							<div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
								{giftDetail.tnc}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex flex-col sm:flex-row gap-4">
				<Link href="/subspace-gifts" className="btn btn-secondary flex-1">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to Gifts
				</Link>

				{!giftDetail.is_claimed && (
					<button className="btn btn-primary flex-1">
						<Gift className="h-4 w-4 mr-2" />
						Claim Gift
					</button>
				)}

				<Link href="/coin-transactions" className="btn btn-secondary">
					<ExternalLink className="h-4 w-4 mr-2" />
					View Transactions
				</Link>
			</div>
		</div>
	);
};


const ProtectedSubspaceGiftPage = () => { 
	return (
		<ProtectedRoute>
			<SubspaceGiftPage />
		</ProtectedRoute>
	)
}

export default ProtectedSubspaceGiftPage;