import { useMutation } from '@tanstack/react-query';
import { updateUserLastActive } from '@/lib/api/auth';

interface UseUpdateUserLastActiveParams {
	userId: string;
	authToken: string;
}

export const useUpdateUserLastActive = ({
	userId,
	authToken
}: UseUpdateUserLastActiveParams
) => {
	return useMutation({
		mutationFn: () => updateUserLastActive({ userId, authToken }),
	});
};

export default useUpdateUserLastActive;
