'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard as Edit2, Camera, User } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore, updateProfile, fetchUserInfo, } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';
import { toast } from 'react-hot-toast';



const ProfileComponent: React.FC = () => {
	const { user, updateUser } = useAuthStore();
	const { t } = useLanguageStore();
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [error, setError] = useState<string | null>(null);
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

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setProfileData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleImageUpload = async (file: File) => {
		if (!user?.id || !user?.auth_token || !file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image size must be less than 5MB');
			return;
		}

		setIsUploadingImage(true);

		try {
			// Convert file to base64
			const base64Image = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					if (typeof reader.result === 'string') {
						resolve(reader.result);
					} else {
						reject(new Error('Failed to convert file to base64'));
					}
				};
				reader.onerror = () => reject(new Error('Failed to read file'));
				reader.readAsDataURL(file);
			});

			// Upload the image using the changeDp mutation
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            mutation MyMutation($image: String = "", $user_id: String = "") {
              __typename
              changeDp(request: { image: $image, user_id: $user_id }) {
                __typename
                dp
              }
            }
          `,
					variables: {
						image: base64Image,
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				toast.error(data.errors[0]?.message || 'Failed to update profile picture');
				return;
			}

			const newDpUrl = data.data?.changeDp?.dp;
			if (newDpUrl) {
				// Update local state
				setProfileData(prev => ({ ...prev, dp: newDpUrl }));
				// Update global user state
				updateUser({ dp: newDpUrl });
				toast.success('Profile picture updated successfully');
			} else {
				toast.error('Failed to update profile picture');
			}
		} catch (error) {
			console.error('Error uploading image:', error);
			toast.error('Failed to upload image');
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			handleImageUpload(file);
		}
		// Reset the input value
		event.target.value = '';
	};

	const handleSave = async () => {
		if (!user?.id) return;

		setIsSaving(true);
		setError(null);

		try {
			const success = await updateProfile(user.id, profileData);
			if (success) {
				updateUser({
					fullname: profileData.fullname,
					name: profileData.fullname,
					email: profileData.email,
					username: profileData.username
				});
				setIsEditing(false);
			} else {
				setProfileData({
					fullname: user?.fullname || user?.name || '',
					email: user?.email || '',
					username: user?.username || '',
					dp: user?.dp || ''
				})
				setError('Failed to update profile');
			}
		} catch (err) {
			setError('An error occurred while updating profile');
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
		setError(null);
		// Reset form data
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
	};

	return (
		<>
			<div className="flex justify-between items-center mb-6">
				{isEditing ? (
					<div className="flex flex-col ml-auto sm:flex-row gap-2">
						<button
							onClick={handleCancel}
							className="btn btn-secondary"
							disabled={isSaving}
						>
							{t('common.cancel')}
						</button>
						<button
							onClick={handleSave}
							className="btn btn-primary"
							disabled={isSaving}
						>
							{isSaving ? t('common.loading') : t('common.save')}
						</button>
					</div>
				) : (
					<button
						onClick={() => setIsEditing(true)}
						className="btn btn-secondary ml-auto"
					>
						<Edit2 className="h-4 w-4 mr-2" />
						{t('profile.edit')}
					</button>
				)}
			</div>

			{/* Profile Picture Section */}
			<div className="flex mb-8">
				<div className="relative">
					<div className="w-24 h-24 rounded-full border overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-1">
						<div className="w-full h-full rounded-full overflow-hidden bg-dark-600 relative">
							{profileData.dp ? (
								<Image
									src={profileData.dp}
									alt={profileData.fullname || 'Profile'}
									fill
									className="object-cover"
								/>
							) : (
								<div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
									<User className="h-16 w-16 text-white" />
								</div>
							)}
						</div>
					</div>

					{/* Edit Icon */}
					{isEditing && !isUploadingImage && (
						<label className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg border-2 border-dark-500">
							<Camera className="h-5 w-5 text-white" />
							<input
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								className="hidden"
								disabled={isUploadingImage}
							/>
						</label>
					)}

					{/* Loading overlay for image upload */}
					{isUploadingImage && (
						<div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
							<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
						</div>
					)}
				</div>
			</div>

			{error && (
				<div className="mb-4 p-3 bg-red-900 bg-opacity-20 text-red-500 rounded-md">
					{error}
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<h3 className="text-sm font-medium text-gray-400 mb-1">{t('profile.fullname')}</h3>
					{isEditing ? (
						<input
							type="text"
							name="fullname"
							value={profileData.fullname}
							onChange={handleInputChange}
							className="input"
							placeholder={t('profile.fullname')}
						/>
					) : (
						<p>{profileData.fullname || 'Not set'}</p>
					)}
				</div>

				<div>
					<h3 className="text-sm font-medium text-gray-400 mb-1">{t('profile.username')}</h3>
					{isEditing ? (
						<input
							type="text"
							name="username"
							value={profileData.username}
							onChange={handleInputChange}
							className="input"
							placeholder={t('profile.username')}
						/>
					) : (
						<p>{profileData.username || 'Not set'}</p>
					)}
				</div>

				<div>
					<h3 className="text-sm font-medium text-gray-400 mb-1">{t('profile.email')}</h3>
					{isEditing ? (
						<input
							type="email"
							name="email"
							value={profileData.email}
							onChange={handleInputChange}
							className="input"
							placeholder={t('profile.email')}
						/>
					) : (
						<p>{profileData.email || 'Not set'}</p>
					)}
				</div>

				<div>
					<h3 className="text-sm font-medium text-gray-400 mb-1">{t('profile.phone')}</h3>
					{isEditing ? (
						<input
							type="phone"
							name="phone"
							value={user?.phone}
							readOnly={!!user?.phone}
							className="input"
							placeholder={t('profile.phone')}
						/>
					) : (
						<p>{user?.phone || 'Not set'}</p>
					)}
				</div>
			</div>
		</>
	);
};

export default ProfileComponent;