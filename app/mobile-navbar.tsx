"use client";

import { Home, Package, MessageCircle, Wallet, User, ShoppingCart } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { useCart } from '@/lib/hooks/cart/use-cart';
import { useUnreadChatsCount } from '@/lib/hooks/chat/use-unread-chats-count';
import { useAuthStore } from "@/lib/store/auth-store";

export default function MobileBottomNav() {
	const router = useRouter();
	const pathname = usePathname();

	const { user } = useAuthStore();

	const { data: cartData } = useCart(user);
	const totalCartItems = cartData?.items?.length || 0;

	const {
		data: unreadChatsCount = 0
	} = useUnreadChatsCount({
		userId: user?.id,
		authToken: user?.auth_token
	});

	const navItems = [
		{ id: "home", label: "Home", icon: Home, href: "/" },
		{ id: "manage", label: "Manage", icon: Package, href: "/manage" },
		{ id: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
		{ id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
		{ id: "cart", label: "Cart", icon: ShoppingCart, href: "/cart" },
		{ id: "profile", label: "Profile", icon: User, href: "/profile" },
	];

	return (
		<div className="bg-dark-800 pb-16 md:hidden">
			<nav className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-gray-700 z-50">
				<div className="flex items-center justify-around px-2 py-3">

					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;

						const showCartBadge = item.id === "cart" && totalCartItems > 0;
						const showChatBadge = item.id === "chat" && unreadChatsCount > 0;

						return (
							<button
								key={item.id}
								onClick={() => router.push(item.href)}
								className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg
								transition-all duration-150
								${isActive ? "text-blue-400" : "text-gray-400 hover:text-gray-200"}`}
							>
								<div className="relative transition-all duration-150 active:scale-90">
									<Icon size={22} strokeWidth={isActive ? 2.5 : 2} />

									{showCartBadge && (
										<span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs
										rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
											{totalCartItems}
										</span>
									)}

									{showChatBadge && (
										<span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs
										rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
											{unreadChatsCount > 99 ? "99+" : unreadChatsCount}
										</span>
									)}
								</div>

								<span className="text-xs font-medium">{item.label}</span>
							</button>
						);
					})}

				</div>
			</nav>
		</div>
	);
}
