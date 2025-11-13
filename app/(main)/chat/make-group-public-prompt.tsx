import React from 'react';
import { Globe, Users, DollarSign, ArrowRight, X } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/language-store';
import UploadTermsComponent from './upload-terms-component';

interface MakeGroupPublicPromptProps {
	groupName: string;
	groupId: string;
	onMakePublic: () => void;
}

const MakeGroupPublicPrompt: React.FC<MakeGroupPublicPromptProps> = ({
	groupName,
	groupId,
	onMakePublic
}) => {
	const { t } = useLanguageStore();
	const [showUploadModal, setShowUploadModal] = React.useState(false);

	const handleMakePublicClick = () => {
		setShowUploadModal(true);
	};

	const handleUploadSuccess = () => {
		setShowUploadModal(false);
		// Call the original callback after successful upload
	};

	return (
		<>
			<div className="flex-1 flex items-center justify-center p-6">
				<div className="max-w-md w-full text-center space-y-6">
					{/* Header */}


					{/* Main Message */}
					<div>
						<p className="text-gray-400 text-md leading-relaxed">
							Share your subscription with others and start earning!
						</p>
					</div>

					{/* Benefits Grid */}
					<div className="grid grid-cols-2 gap-4">
						<div className="bg-dark-400/50 rounded-xl p-4 border border-green-500/30">
							<div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
								<Users className="h-5 w-5 text-green-400" />
							</div>
							<h3 className="font-bold text-white text-sm mb-1">Get Members</h3>
							<p className="text-gray-400 text-xs">Others can join your group</p>
						</div>
						<div className="bg-dark-400/50 rounded-xl p-4 border border-blue-500/30">
							<div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
								<DollarSign className="h-5 w-5 text-blue-400" />
							</div>
							<h3 className="font-bold text-white text-sm mb-1">Share Costs</h3>
							<p className="text-gray-400 text-xs">Split expenses with others</p>
						</div>
					</div>

					{/* Action Button */}
					<div className="space-y-4">
						<button
							onClick={handleMakePublicClick}
							className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
						>
							<Globe className="h-5 w-5" />
							<span>Make Group Public</span>
							<ArrowRight className="h-5 w-5" />
						</button>
					</div>
				</div>
			</div>

			{/* Upload Terms Modal */}
			{showUploadModal && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
					<div className="bg-dark-500 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
						{/* Modal Header */}
						<div className="flex items-center justify-between p-6 border-b border-gray-700">
							<h3 className="text-xl font-bold text-white">Make Group Public</h3>
							<button
								onClick={() => setShowUploadModal(false)}
								className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6">
							<UploadTermsComponent
								groupId={groupId}
								onMakePublic={handleUploadSuccess}
							/>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default MakeGroupPublicPrompt;