import { Toaster } from 'react-hot-toast';

export default function ToastConfig() {
	return (
		<Toaster
			position="top-center"
			reverseOrder={false}
			toastOptions={{
				className: 'shadow-lg rounded-lg',
				duration: 4000,
				style: {
					background: '#1f1f1f',
					color: '#eaeaea',
					border: '1px solid #333',
					maxWidth: '800px',
					whiteSpace: 'normal',
					wordBreak: 'break-word',
				},
				success: { iconTheme: { primary: '#22c55e', secondary: '#1f1f1f' } },
				error: { iconTheme: { primary: '#ef4444', secondary: '#1f1f1f' } },
			}}
		/>
	);
}
