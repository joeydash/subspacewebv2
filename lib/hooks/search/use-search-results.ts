// hooks/useSearchResults.ts
import { useQuery } from "@tanstack/react-query";
import { fetchSearchResults } from "../../api/search";

export const useSearchResults = ({
	searchQuery,
	user,
	suggestionId,
	suggestionIndex,
	location,
}: {
	searchQuery: string;
	user?: { id?: string; auth_token?: string };
	suggestionId: string;
	suggestionIndex?: string;
	location: { latitude: string; longitude: string };
}) => {
	return useQuery({
		queryKey: ["search_results",  suggestionId],
		queryFn: () =>
			fetchSearchResults({
				searchQuery,
				user,
				suggestionId,
				suggestionIndex,
				location,
			}),
		enabled: !!searchQuery.trim(), // only run if non-empty
		staleTime: 5 * 60 * 1000, 
	});
};
