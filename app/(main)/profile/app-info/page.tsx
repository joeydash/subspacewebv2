'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { Users, FileText, Shield, ScrollText, RotateCcw, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

interface TeamMember {
	name: string;
	designation: string;
	image: string;
}
const AppInfoComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [showTeamDetails, setShowTeamDetails] = useState(false);
	const [isLoadingTeam, setIsLoadingTeam] = useState(false);
	const [teamError, setTeamError] = useState<string | null>(null);

	const fetchTeamDetails = async () => {
		if (!user?.auth_token) return;

		setIsLoadingTeam(true);
		setTeamError(null);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query getTeamDetails {
              __typename
              our_team(order_by: { order: asc }) {
                __typename
                name
                designation
                image
              }
            }
          `
				})
			});

			const data = await response.json();

			if (data.errors) {
				setTeamError('Failed to fetch team details');
				return;
			}

			setTeamMembers(data.data?.our_team || []);
			setShowTeamDetails(true);
		} catch (error) {
			console.error('Error fetching team details:', error);
			setTeamError('Failed to fetch team details');
		} finally {
			setIsLoadingTeam(false);
		}
	};

	const handleSectionClick = (section: string) => {
		// Handle navigation to different sections
		switch (section) {
			case 'team':
				fetchTeamDetails();
				break;
			case 'licenses':
				window.open('https://blogs.subspace.money/docs/whatsub-single-docs-subspace-policies-licences', '_blank');
				break;
			case 'privacy':
				window.open('https://blogs.subspace.money/docs/whatsub-single-docs-subspace-policies-privacy-policy', '_blank');
				break;
			case 'terms':
				window.open('https://blogs.subspace.money/docs/whatsub-single-docs-subspace-policies-terms-and-conditions', '_blank');
				break;
			case 'refund':
				window.open('https://blogs.subspace.money/docs/whatsub-single-docs-subspace-policies-return-and-refund-policy', '_blank');
				break;
			default:
				break;
		}
	};

	if (showTeamDetails) {
		return (
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center gap-4">
					<button
						onClick={() => setShowTeamDetails(false)}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<ChevronRight className="h-6 w-6 rotate-180" />
					</button>
					<div>
						<h2 className="text-xl md:text-2xl font-bold">Our Team</h2>
						<p className="text-gray-400">Individuals can and do make a difference, but it takes a team to really mess things up. 🤖</p>
					</div>
				</div>

				{/* Loading State */}
				{isLoadingTeam && (
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
					</div>
				)}

				{/* Error State */}
				{teamError && (
					<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
						<p className="text-red-400">{teamError}</p>
						<button
							onClick={fetchTeamDetails}
							className="mt-4 btn btn-primary"
						>
							Try Again
						</button>
					</div>
				)}

				{/* Team Members Grid */}
				{!isLoadingTeam && !teamError && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{teamMembers.map((member, index) => (
							<div key={index} className="bg-dark-400 rounded-xl p-6 text-center">
								<div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
									<Image
										src={member.image}
										alt={member.name}
										width={96}
										height={96}
										className="w-full h-full object-cover"
									/>
								</div>
								<h3 className="text-lg font-bold text-white mb-2">{member.name}</h3>
								<p className="text-gray-400">{member.designation}</p>
							</div>
						))}
					</div>
				)}

				{/* Empty State */}
				{!isLoadingTeam && !teamError && teamMembers.length === 0 && (
					<div className="bg-dark-400 rounded-xl p-12 text-center">
						<div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<Users className="h-8 w-8 text-gray-500" />
						</div>
						<h3 className="text-xl font-bold mb-2">No Team Members Found</h3>
						<p className="text-gray-400">Team information is not available at the moment.</p>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-xl md:text-2xl font-bold mb-2">App Info</h2>
			</div>

			{/* App Version and Logo */}
			<div className="text-center py-8">
				<div className="w-32 h-32 mx-auto mb-6 bg-dark-400 rounded-2xl overflow-hidden flex items-center justify-center">
					<Image
						src="/favicon.svg"
						alt="Subspace Logo"
						width={96}
						height={96}
						className="w-24 h-24 object-contain"
					/>
				</div>

				<p className="text-gray-400">Subspace Technologies Private Limited</p>
			</div>

			{/* Menu Items */}
			<div className="space-y-2">
				{/* Team */}
				<button
					onClick={() => handleSectionClick('team')}
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
				>
					<div className="flex items-center gap-3">
						<Users className="h-5 w-5 text-blue-400" />
						<span className="font-medium">Team</span>
					</div>
					<ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
				</button>

				{/* Licenses */}
				<button
					onClick={() => handleSectionClick('licenses')}
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
				>
					<div className="flex items-center gap-3">
						<FileText className="h-5 w-5 text-purple-400" />
						<span className="font-medium">Licenses</span>
					</div>
					<ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
				</button>

				{/* Privacy Policy */}
				<button
					onClick={() => handleSectionClick('privacy')}
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
				>
					<div className="flex items-center gap-3">
						<Shield className="h-5 w-5 text-green-400" />
						<span className="font-medium">Privacy Policy</span>
					</div>
					<ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
				</button>

				{/* Terms And Conditions */}
				<button
					onClick={() => handleSectionClick('terms')}
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
				>
					<div className="flex items-center gap-3">
						<ScrollText className="h-5 w-5 text-orange-400" />
						<span className="font-medium">Terms And Conditions</span>
					</div>
					<ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
				</button>

				{/* Return And Refund Policy */}
				<button
					onClick={() => handleSectionClick('refund')}
					className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
				>
					<div className="flex items-center gap-3">
						<RotateCcw className="h-5 w-5 text-blue-400" />
						<span className="font-medium">Return And Refund Policy</span>
					</div>
					<ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
				</button>
			</div>
		</div>
	);
};

export default AppInfoComponent;