import { useMutation } from "@tanstack/react-query";
import { rentProduct } from "../../api/rent"; // adjust import path as needed
import { toast } from 'react-hot-toast';

interface RentProductParams {
	address_id: string;
	user_id: string;
	product_id: string;
	product_location_id: string;
	start_time: string;
	end_time: string;
	auth_token?: string;
}

interface RentProductResponse {
	message: string;
	affected_rows: number;
	details?: any;
}

export const useRentProductMutation = () => {
	return useMutation<RentProductResponse, Error, RentProductParams>({
		mutationFn: (params) => rentProduct(params),

		onSuccess: (data) => {
			if (data?.data?.success) {
				toast.success(data?.data.message);
			} else if (data?.details?.amount_required) {
				toast.error("Please proceed with payment to rent the product");
			} else {
				toast.error(data?.message || "Failed to rent product");
			}
		},
		onError: (error) => {
			toast.error("Failed to rent product:", error.message);
		},
	});
};
