import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLowestDiscountPlans } from '@/lib/hooks/plans/use-lowest-discount-plans';

const InfiniteScroller = () => {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const animationIdRef = useRef<number | null>(null);
	const [isPaused, setIsPaused] = useState(false);
	const { data: plans, isLoading } = useLowestDiscountPlans();

	const router = useRouter();

	useEffect(() => {
		const scroller = scrollerRef.current;
		if (!scroller) return;

		const scrollContent = scroller.querySelector('.scroll-content') as HTMLDivElement;
		if (!scrollContent) return;

		let scrollPosition = 0;
		const scrollWidth = scrollContent.scrollWidth / 2;

		const scroll = () => {
			if (!isPaused) {
				scrollPosition += 1;

				if (scrollPosition >= scrollWidth) {
					scrollPosition = 0;
				}

				scroller.scrollLeft = scrollPosition;
			}
			animationIdRef.current = requestAnimationFrame(scroll);
		};

		animationIdRef.current = requestAnimationFrame(scroll);

		return () => {
			if (animationIdRef.current) {
				cancelAnimationFrame(animationIdRef.current);
			}
		};
	}, [plans, isPaused]);

	const formatDiscount = (price: number, discountedPrice: number) => {
		const discount = Math.round(((price - discountedPrice) / price) * 100);
		return discount;
	};

	const renderMessage = (plan: any) => {
		const discount = formatDiscount(plan.price, plan.discounted_price);
		return (
			<button onClick={() => router.push('/products/' + plan.service_id)} className='cursor-pointer'>
				<span>{plan.whatsub_service.service_name}</span>
				<span className="mx-0.5"></span>
				<span className="font-bold text-green-400">{discount}% OFF</span>
				<span className="mx-1.5">-</span>
				<span>₹{plan.discounted_price} for {plan.duration} {plan.duration_type}</span>
			</button>
		);
	};

	if (isLoading || !plans || plans.length === 0) {
		return (
			<div className="w-full bg-linear-to-r from-gray-800/90 to-gray-900/90 border-b border-gray-700/50">
				<div className="overflow-hidden whitespace-nowrap">
					<div className="flex items-center justify-center px-3 py-2 text-xs font-medium text-white">
						Loading amazing deals...
					</div>
				</div>
			</div>
		);
	}


	return (
		<div
			className="w-full bg-linear-to-r from-gray-800/90 to-gray-900/90 border-b border-gray-700/50"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
		>
			<div
				ref={scrollerRef}
				className="overflow-hidden whitespace-nowrap cursor-pointer"
				style={{ scrollBehavior: 'auto' }}
			>
				<div className="scroll-content inline-flex py-2">
					{plans?.map((plan, index) => (
						<div
							key={`${plan.id}-${index}`}
							className="inline-flex items-center text-xs text-white"
						>
							{renderMessage(plan)}
							<span className="mx-3 text-white/30">|</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default InfiniteScroller;
