import type { HTMLAttributes } from 'react';

import logoAsset from '@/public/subspace-hor_002.svg';

export type SubspaceLoaderProps = HTMLAttributes<HTMLDivElement> & {
	animationDuration?: number;
};

const SubspaceLoader = ({
	animationDuration = 3,
	className,
	style,
	'aria-label': ariaLabel,
	...rest
}: SubspaceLoaderProps) => {
	const duration = `${animationDuration}s`;

	return (
		<div
			role="img"
			aria-label={ariaLabel ?? 'Subspace loading indicator'}
			aria-hidden={ariaLabel ? undefined : true}
			className={className}
			style={{
				width: 240,
				height: 50,
				backgroundColor: '#ffffff',
				maskImage: `url(${logoAsset.src})`,
				WebkitMaskImage: `url(${logoAsset.src})`,
				maskRepeat: 'no-repeat',
				WebkitMaskRepeat: 'no-repeat',
				maskSize: 'contain',
				WebkitMaskSize: 'contain',
				maskPosition: 'center',
				WebkitMaskPosition: 'center',
				animation: `loading ${duration} ease-in-out infinite`,
				display: 'inline-block',
				...style,
			}}
			{...rest}
		>
			<style jsx>{`
				@keyframes loading {
					0% {
						opacity: 1;
					}
					40% {
						opacity: 0.25;
					}
					60% {
						opacity: 0.25;
					}
					100% {
						opacity: 1;
					}
				}
			`}</style>
		</div>
	);
};

export default SubspaceLoader;
