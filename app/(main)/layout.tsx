import Navbar from "./navbar";
import Footer from "./footer";

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex flex-col min-h-screen">
			<Navbar />
			<main className="grow mt-16">
				{children}
			</main>
			<Footer />
		</div>
	);
}

