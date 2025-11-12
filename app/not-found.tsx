import Link from 'next/link';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
	return (
		<div className="page-container pt-24 flex items-center justify-center min-h-[calc(100vh-16rem)]">
			<div className="text-center">
				<h2 className="text-3xl font-bold mt-4 mb-2">Page Not Found</h2>
				<p className="text-gray-400 mb-8 max-w-md mx-auto">
					The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
				</p>
				<Link href="/" className="btn btn-primary inline-flex">
					<Home className="h-5 w-5 mr-2" />
					Back to Home
				</Link>
			</div>
		</div>
	);
};

export default NotFoundPage;