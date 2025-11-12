import React from 'react';
import { X, CircleAlert as AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	message: string;
	title?: string;
	confirmText?: string;
	cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	message,
	title = 'Confirm Action',
	confirmText = 'Confirm',
	cancelText = 'Cancel',
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
			<div className="bg-dark-500 rounded-2xl w-full max-w-md relative border border-gray-700 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
					<h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
					>
						<X className="h-4 w-4 sm:h-5 sm:w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 sm:p-6">
					<div className="text-center mb-4 sm:mb-6">
						<div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
							<AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400" />
						</div>
						<p className="text-gray-300 text-sm sm:text-base">{message}</p>
					</div>

					<div className="flex gap-2 sm:gap-3">
						<button
							onClick={onClose}
							className="flex-1 py-2.5 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white text-sm sm:text-base rounded-lg transition-colors font-medium"
						>
							{cancelText}
						</button>
						<button
							onClick={onConfirm}
							className="flex-1 py-2.5 sm:py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm sm:text-base rounded-lg transition-colors font-medium"
						>
							{confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConfirmationModal;