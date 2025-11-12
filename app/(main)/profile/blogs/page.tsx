'use client';


import React, { useState } from 'react';
import { BookOpen, Filter, ExternalLink, Calendar, Search } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/auth-store';
import BlogsSkeleton from './blogs-skeleton';
import { useBlogs } from '@/lib/hooks/blogs/use-blogs';
import type { Blog } from '@/lib/api/blogs';

const BlogsComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [selectedCategory, setSelectedCategory] = useState<string>('All');
	const [searchQuery, setSearchQuery] = useState('');

	const COURSEX_ID = '42b0ee58-2303-4178-a1f7-f2786298f68d';

	const {
		data: blogsData,
		isLoading,
		error,
	} = useBlogs({
		authToken: user?.auth_token || '',
		courseId: COURSEX_ID,
		categoryTitle: ''
	});

	const blogs = blogsData?.blogs || [];
	const categories = blogsData?.categories || [];

	const filteredBlogs = blogs.filter(blog => {
		const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			blog.section_title.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = selectedCategory === 'All' || blog.section_title === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const handleBlogClick = (blog: Blog) => {
		if (blog.url) {
			window.open('https://blogs.subspace.money/blog/' + blog.url);
		}
	};

	// const handleRefresh = () => {
	// 	refetch();
	// };

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
						<BookOpen className="h-6 w-6 text-indigo-400" />
						Blogs and Articles
					</h2>
					<p className="text-gray-400 mt-1">Stay updated with the latest insights and tips</p>
				</div>
				{/* <button
					onClick={handleRefresh}
					disabled={isLoading}
					className="p-2 text-gray-400 hover:text-white hover:bg-dark-400 rounded-lg transition-colors"
				>
					<RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
				</button> */}
			</div>

			{/* Search and Filters */}
			<div className="space-y-4">
				{/* Search Bar */}
				{!isLoading && <>
					<div className="relative">
						<input
							type="text"
							placeholder="Search blogs and articles..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="input pl-12 w-full rounded-full"
						/>
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					</div>

					{/* Category Filters */}
					<div className="flex items-start gap-3">
						<div className="shrink-0 pt-2">
							<Filter className="h-5 w-5 text-gray-400" />
						</div>
						<div className="flex-1 min-w-0 ">
							{/* Horizontal scroll container with custom scrollbar */}
							<div
								className="overflow-x-auto overflow-y-hidden pb-3 hide-scrollbar">
								<div className="flex items-center space-x-3 w-max px-1">
									<button
										onClick={() => setSelectedCategory('All')}
										className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === 'All'
											? 'bg-indigo-500 text-white shadow-lg'
											: 'bg-dark-400 text-gray-400 hover:bg-dark-300 hover:text-white'
											}`}
									>
										All
									</button>
									{categories.map((category) => (
										<button
											key={category.title}
											onClick={() => setSelectedCategory(category.title)}
											className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category.title
												? 'bg-indigo-500 text-white shadow-lg'
												: 'bg-dark-400 text-gray-400 hover:bg-dark-300 hover:text-white'
												}`}
										>
											{category.title}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				</>}
			</div>

			{/* Error State */}
			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
					<p className="text-red-400">{error instanceof Error ? error.message : 'Failed to fetch blogs and categories'}</p>
				</div>
			)}

			{/* Loading State */}
			{isLoading && (
				<BlogsSkeleton count={9} showFilters={true} />
			)}

			{/* Blogs Grid */}
			{!isLoading && !error && (
				<>
					{filteredBlogs.length === 0 ? (
						<div className="bg-dark-400 rounded-xl p-12 text-center">
							<div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<BookOpen className="h-8 w-8 text-gray-500" />
							</div>
							<h3 className="text-xl font-bold mb-2">No Articles Found</h3>
							<p className="text-gray-400">
								{searchQuery || selectedCategory !== 'All'
									? 'Try adjusting your search or filter criteria'
									: 'No articles are available at the moment'
								}
							</p>
						</div>
					) : (
						<div className="h-[490px] overflow-y-auto hide-scrollbar">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
								{filteredBlogs.map((blog) => (
									<div
										key={blog.id}
										onClick={() => handleBlogClick(blog)}
										className="bg-dark-400 rounded-xl overflow-hidden hover:bg-dark-300 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-indigo-500/10 border border-gray-700/50 hover:border-indigo-500/50"
									>
										{/* Blog Image */}
										<div className="relative h-48 overflow-hidden">
											<Image
												src={blog.image_url}
												alt={blog.title}
												fill
												className="object-cover transition-transform duration-300 group-hover:scale-110"
											/>
											<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>

											{/* Category Badge */}
											<div className="absolute top-2 left-2 bg-indigo-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
												{blog.section_title}
											</div>

											{/* External Link Icon */}
											<div className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
												<ExternalLink className="h-4 w-4 text-white" />
											</div>
										</div>

										{/* Blog Content */}
										<div className="px-2 py-4">
											<h3 className="font-bold text-md text-white mb-3 truncate group-hover:text-indigo-400 transition-colors">
												{blog.title}
											</h3>

											<div className="flex items-center gap-2 text-sm text-gray-400">
												<Calendar className="h-4 w-4" />
												<span>{formatDate(blog.created_at)}</span>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Results Count */}
					{filteredBlogs.length > 0 && (
						<div className="text-center text-gray-400 text-sm">
							Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'article' : 'articles'}
							{searchQuery && ` for "${searchQuery}"`}
							{selectedCategory !== 'All' && ` in ${selectedCategory}`}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default BlogsComponent;