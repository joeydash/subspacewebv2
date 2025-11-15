import React, { useEffect } from 'react';


interface ModalProps {
	open: boolean;
	onClose?: () => void;
	children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
	useEffect(() => {
		if (open) {
			document.documentElement.classList.add('overflow-hidden');
		} else {
			document.documentElement.classList.remove('overflow-hidden');
		}

		return () => {
			document.documentElement.classList.remove('overflow-hidden');
		};
	}, [open]);

	return (
		<div
			onClick={onClose}
			className={`fixed inset-0 flex justify-center items-center z-50 transition-colors duration-300 ${open ? "pointer-events-auto" : "bg-transparent pointer-events-none"}`}
		>
			<div
				aria-hidden={!open}
				className={`absolute inset-0 transition-all duration-300 ${open ? 'bg-black/30 pointer-events-auto backdrop-blur-sm' : 'bg-transparent pointer-events-none backdrop-blur-0'}`}
			></div>

			<div
				onClick={(e) => e.stopPropagation()}
				className={`relative rounded-xl shadow p-6 transition-all duration-300 transform w-full max-w-lg mx-4 ${open ? "translate-y-0 opacity-100 scale-100" : "opacity-0 scale-95"}`}
			>
				{children}
			</div>
		</div>
	);
}