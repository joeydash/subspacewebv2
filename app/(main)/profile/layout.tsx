'use client';

import { useState, useEffect } from 'react';
import { User, Package, CreditCard, LogOut, Users, Settings, PiggyBank, BookOpen, Mail, BadgeInfo, Star, Info, Clock, Menu, X, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore, fetchUserInfo } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import ProtectedRoute from '@/components/protected-route';


const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
	const { user, logout } = useAuthStore();
	const { t } = useLanguageStore();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	const [profileData, setProfileData] = useState({
		fullname: user?.fullname || user?.name || '',
		email: user?.email || '',
		username: user?.username || '',
		dp: user?.dp || ''
	});

	useEffect(() => {
		if (user?.id) {
			fetchUserInfo(user.id).then(info => {
				if (info) {
					setProfileData({
						fullname: info.fullname || '',
						email: info.email || '',
						username: info.username || '',
						dp: info.dp || ''
					});
				}
			});
		}
	}, [user?.id]);

	// Update profileData when user data changes (including dp)
	useEffect(() => {
		if (user) {
			setProfileData(prev => ({
				...prev,
				fullname: user.fullname || user.name || '',
				email: user.email || '',
				username: user.username || '',
				dp: user.dp || ''
			}));
		}
	}, [user]);

	const handleLogout = () => {
		logout();
		router.push('/');
	};

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	const closeSidebar = () => {
		setIsSidebarOpen(false);
	};

	// Close sidebar when route changes on mobile
	useEffect(() => {
		setIsSidebarOpen(false);
	}, [pathname]);

	// Prevent body scroll when sidebar is open on mobile
	useEffect(() => {
		if (isSidebarOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isSidebarOpen]);

	// Get active tab from URL
	const getActiveTab = () => {
		const path = pathname;
		if (path === '/profile' || path === '/profile/') return 'profile';
		const tab = path.split('/profile/')[1];
		return tab || 'profile';
	};

	const activeTab = getActiveTab();

	return (
		<div className="max-w-[2000px] mx-auto pt-20 md:pt-12">
			{/* Mobile Header with Toggle */}
			<div className="md:hidden flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<button
						onClick={toggleSidebar}
						className="p-2 text-gray-400 hover:text-white hover:bg-dark-400 rounded-lg transition-colors"
					>
						<Menu className="h-6 w-6" />
					</button>
					<h1 className="text-2xl font-bold">{t('nav.profile')}</h1>
				</div>
			</div>

			{/* Mobile Sidebar Overlay */}
			{isSidebarOpen && (
				<div
					className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
					onClick={closeSidebar}
				/>
			)}

			<div className="max-w-[1800px] mx-auto flex flex-col md:flex-row gap-0">
				{/* Sidebar */}
				<div className="order-2 md:order-1 md:w-[280px] flex-shrink-0">
					<div className={`md:static md:transform-none md:transition-none fixed top-0 left-0 h-full w-full z-50 transition-transform duration-300 ease-in-out rounded-lg md:rounded-none flex flex-col ${isSidebarOpen ? 'bg-dark-400 transform translate-x-0' : 'transform -translate-x-full'
						} md:translate-x-0`}>
						{/* Mobile Close Button */}
						<div className="md:hidden flex items-center justify-between p-6 pb-4 flex-shrink-0">
							<h2 className="text-xl font-bold">{t('nav.profile')}</h2>
							<button
								onClick={closeSidebar}
								className="p-2 text-gray-400 hover:text-white hover:bg-dark-400 rounded-lg transition-colors"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="flex items-center px-6 pb-6 flex-shrink-0">
							<div className="bg-indigo-900 rounded-full overflow-hidden mr-4 w-12 h-12 flex items-center justify-center relative" suppressHydrationWarning>
								{profileData.dp ? (
									<Image
										src={profileData.dp}
										alt="Display Picture"
										fill
										className="rounded-full object-cover"
									/>
								) : (
									<User className="h-6 w-6 text-indigo-400" />
								)}
							</div>

							<div>
								<h2 className="font-bold" suppressHydrationWarning>{profileData.fullname || 'User'}</h2>
								<p className="text-gray-400 text-sm" suppressHydrationWarning>{user?.phone || ''}</p>
							</div>
						</div>

						<div className="space-y-1 px-6 pb-6 overflow-y-auto flex-1 small-scrollbar">
							<Link
								href="/profile"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'profile' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<User className="h-5 w-5 mr-3" />
								{t('nav.profile')}
							</Link>
							<Link
								href="/profile/payment"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'payment' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<CreditCard className="h-5 w-5 mr-3" />
								Payout Methods
							</Link>
							<Link
								href="/profile/addresses"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'addresses' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<MapPin className="h-5 w-5 mr-3" />
								My Addresses
							</Link>
							<Link
								href="/profile/order-history"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'order-history' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Clock className="h-5 w-5 mr-3" />
								Order History
							</Link>
							<Link
								href="/profile/rental-history"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'rental-history' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Package className="h-5 w-5 mr-3" />
								Rental History
							</Link>
							<Link
								href="/friends"
								className="w-full text-left px-4 py-2 rounded-full text-gray-400 hover:bg-dark-400 hover:text-white flex items-center"
							>
								<Users className="h-5 w-5 mr-3" />
								{t('nav.friends')}
							</Link>
							<Link
								href="/profile/settings"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'settings' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Settings className="h-5 w-5 mr-3" />
								Settings
							</Link>
							<Link
								href="/profile/money-saved"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'money-saved' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<PiggyBank className="h-5 w-5 mr-3" />
								Money Saved
							</Link>
							<Link
								href="/profile/blogs"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'blogs' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<BookOpen className="h-5 w-5 mr-3" />
								Blogs and Articles
							</Link>
							<Link
								href="/profile/mailbox"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'mailbox' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Mail className="h-5 w-5 mr-3" />
								AI-powered Mailbox
							</Link>
							<Link
								href="/profile/help"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'help' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<BadgeInfo className="h-5 w-5 mr-3" />
								Help And Support
							</Link>
							<button
								onClick={() => window.open('https://play.google.com/store/apps/details?id=org.grow90.whatsub')}
								className="w-full text-left px-4 py-2 rounded-full text-gray-400 hover:bg-dark-400 hover:text-white flex items-center"
							>
								<Star className="h-5 w-5 mr-3" />
								Review Us
							</button>
							<Link
								href="/profile/app-info"
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'app-info' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Info className="h-5 w-5 mr-3" />
								App Info
							</Link>
							<button
								onClick={handleLogout}
								className="w-full text-left px-4 py-2 rounded-full text-red-500 hover:bg-red-900 hover:bg-opacity-20 flex items-center"
							>
								<LogOut className="h-5 w-5 mr-3" />
								Log Out
							</button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="order-1 md:order-3 flex-1 min-w-0 md:pl-8">
					<div className="rounded-lg overflow-hidden md:mt-0">
						<div className="max-sm:max-h-[800px] sm:h-[800px] overflow-y-auto small-scrollbar max-sm:p-2 sm:px-2">
							{children}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};


const ProtectedProfileLayout = ({ children }: { children: React.ReactNode }) => { 
	return (
		<ProtectedRoute>
			<ProfileLayout>
				{children}
			</ProfileLayout>
		</ProtectedRoute>
	)
}

export default ProtectedProfileLayout;