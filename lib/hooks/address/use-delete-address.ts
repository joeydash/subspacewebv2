import { useMutation } from "@tanstack/react-query";
import { deleteAddress } from "../../api/address";
import {ADDRESSES_BASE_KEY} from "./use-addresses";
import { toast } from "react-hot-toast";

interface DeleteAddressParams {
	authToken: string;
	userId: string;
}

export const useDeleteAddress = ({ authToken, userId }: DeleteAddressParams) => {
	return useMutation({
		mutationFn: ({ id }: { id: string }) => deleteAddress({ addressId: id, authToken }),
		onMutate: (deletedAddress, context) => {
			const previousAddresses = context.client.getQueryData([ADDRESSES_BASE_KEY, userId]) || [];

			const newAddresses = previousAddresses?.filter(address => address.id !== deletedAddress.id);

			context.client.setQueryData([ADDRESSES_BASE_KEY, userId], newAddresses);
			return { previousAddresses };
		},
		onError: (error: Error, _deletedAddress, onMutateResult, context) => {
			toast.error(error.message || "Failed to delete address");
			
			const previousAddresses = onMutateResult?.previousAddresses || [];
			context?.client.setQueryData([ADDRESSES_BASE_KEY, userId], previousAddresses);
		},
	});
};
