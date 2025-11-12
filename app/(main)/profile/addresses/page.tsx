'use client';

import React, { useState } from 'react';
import { MapPin, Plus, Home, Building, Hotel, Edit2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import AddressesSkeleton from './addresses-skeleton';
import { useQueryClient } from "@tanstack/react-query";
import { useAddresses } from '@/lib/hooks/address/use-addresses';
import { useDeleteAddress } from '@/lib/hooks/address/use-delete-address';
import AddAddressModal from '@/components/add-address-modal';

interface Address {
	id: string;
	type: 'home' | 'work' | 'hotel' | 'other';
	name: string;
	contact_number: string;
	fhb_name: string;
	floor: string;
	latitude: string;
	longitude: string;
	full_address: string;
}



const AddressesComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [showAddModal, setShowAddModal] = useState(false);
	const [editingAddress, setEditingAddress] = useState<Address | null>(null);

	const queryClient = useQueryClient();
	const { data: addresses, isLoading } = useAddresses({ userId: user?.id || '', authToken: user?.auth_token || '' });
	const { mutate: deleteAddressMutation } = useDeleteAddress({ authToken: user?.auth_token || '', userId: user?.id || '' });

	const handleAddAddress = () => {
		setEditingAddress(null);
		setShowAddModal(true);
	};

	const handleModalSuccess = async () => {
		queryClient.invalidateQueries({ queryKey: ["addresses"] });
		setEditingAddress(null);
	};


	const getAddressTypeIcon = (type: string) => {
		switch (type) {
			case 'home':
				return <Home className="h-5 w-5 text-green-400" />;
			case 'work':
				return <Building className="h-5 w-5 text-blue-400" />;
			case 'hotel':
				return <Hotel className="h-5 w-5 text-purple-400" />;
			default:
				return <MapPin className="h-5 w-5 text-purple-400" />;
		}
	};

	// const getAddressTypeColor = (type: string) => {
	// 	switch (type) {
	// 		case 'home':
	// 			return 'bg-green-500/20 text-green-400 border-green-500/30';
	// 		case 'work':
	// 			return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
	// 		case 'hotel':
	// 			return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
	// 		default:
	// 			return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
	// 	}
	// };

	// const formatAddress = (address: Address) => {
	// 	const parts = [
	// 		address.address_line_1,
	// 		address.address_line_2,
	// 		address.city,
	// 		address.state,
	// 		address.pincode,
	// 		address.country
	// 	].filter(Boolean);

	// 	return parts.join(', ');
	// };

	return (
		<div className="space-y-4 md:space-y-6 max-w-6xl">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
				<div>
					<h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
						<MapPin className="h-5 w-5 md:h-6 md:w-6 text-indigo-400" />
						My Addresses
					</h2>
					<p className="text-gray-400 text-sm md:text-base">Manage your delivery addresses</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={handleAddAddress}
						className="btn btn-primary flex items-center gap-2 text-sm md:text-base py-2 md:py-2.5 px-3 md:px-4"
					>
						<Plus className="h-4 w-4" />
						Add Address
					</button>
				</div>
			</div>

		{isLoading ? (
			<AddressesSkeleton count={3} />
		) : (
			<>
				{addresses.length === 0 ? (
					<div className="bg-dark-400 rounded-xl p-6 md:p-12 text-center">
						<div className="w-12 h-12 md:w-16 md:h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
							<MapPin className="h-6 w-6 md:h-8 md:w-8 text-gray-500" />
						</div>
						<h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">No Addresses Added</h3>
						<p className="text-gray-400 text-sm md:text-base mb-4 md:mb-6">Add your first delivery address to get started</p>
					</div>
				) : (
					<div className="max-h-[600px] overflow-y-auto divide-y divide-gray-800/80 scrollbar-hide">
						{addresses.map((address: Address) => (
							<div
								key={address.id}
								className="py-3 md:py-4 flex flex-col sm:flex-row justify-between sm:items-start gap-3 sm:gap-0 transition-colors"
							>
									{/* Address Info */}	
									<div className="flex-1 min-w-0">
										<div className="font-bold text-white capitalize flex items-center gap-2 text-sm md:text-base">{getAddressTypeIcon(address.type)}{address.type}</div>
										<div className="text-gray-300 text-xs md:text-sm mt-1 break-words">{address.full_address}</div>
									</div>

									{/* Actions */}
									<div className="flex gap-2 sm:ml-4 self-end sm:self-start">
										<button
											onClick={() => {
												setEditingAddress(address);
												setShowAddModal(true);
											}}
											className="p-2 text-gray-400 hover:text-white hover:bg-dark-300 rounded-lg transition-colors"
											title="Edit address"
										>
											<Edit2 className="h-4 w-4" />
										</button>

										<button
											onClick={() => deleteAddressMutation({ id: address.id })}
											className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
											title="Delete address"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}

			{/* Add Address Modal */}
			<AddAddressModal
				isOpen={showAddModal}
				onClose={() => {
					setShowAddModal(false);
					setEditingAddress(null);
				}}
				onSuccess={handleModalSuccess}
				editingAddress={editingAddress}
			/>
		</div>
	);
};

export default AddressesComponent;