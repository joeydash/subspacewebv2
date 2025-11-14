'use client';


import React, { useState } from 'react';
import { MessageSquare, ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import QuickReplyList from './quick-reply-list';
import QuickReplyForm from './quick-reply-form';

const QuickReplySettingsComponent: React.FC = () => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [showQuickReplyForm, setShowQuickReplyForm] = useState(false);

	return (
		<>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-3 sm:p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
			>
				<div className="flex items-center gap-2 sm:gap-3">
					<MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
					<span className="text-sm sm:text-base font-medium">Quick Reply</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				) : (
					<ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-white" />
				)}
			</button>

			{isExpanded && (
				<div className="rounded-lg p-2 sm:p-3">
					<>
						<div className="flex items-center justify-between mb-4 sm:mb-6">
							<h3 className="text-sm sm:text-base font-bold text-white">Add Quick Reply</h3>
							<button
								onClick={() => {
									setShowQuickReplyForm(!showQuickReplyForm);
								}}
								className="p-1.5 sm:p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
							>
								{showQuickReplyForm ? (
									<X className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
								) : (
									<Plus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
								)}
							</button>
						</div>

						{showQuickReplyForm ? (
							<QuickReplyForm />
						) : (
							<QuickReplyList/>
						)}
					</>
				</div>
			)}
		</>
	);
};

export default QuickReplySettingsComponent;
