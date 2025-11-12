import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/language-store';

interface DatePickerProps {
	selectedDate: Date;
	onDateChange: (date: Date) => void;
	minDate?: Date;
	maxDate?: Date;
	placeholder?: string;
	className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
	selectedDate,
	onDateChange,
	minDate,
	maxDate,
	placeholder,
	className = ""
}) => {
	const { t } = useLanguageStore();
	const [isOpen, setIsOpen] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth()));
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	const getDaysInMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

	const isDateDisabled = (date: Date) => {
		if (minDate && date < minDate) return true;
		if (maxDate && date > maxDate) return true;
		return false;
	};

	const isSameDay = (date1: Date, date2: Date) => {
		return date1.getDate() === date2.getDate() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getFullYear() === date2.getFullYear();
	};

	const handleDateClick = (day: number) => {
		const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		if (!isDateDisabled(newDate)) {
			onDateChange(newDate);
			setIsOpen(false);
		}
	};

	const navigateMonth = (direction: 'prev' | 'next') => {
		setCurrentMonth(prev => {
			const newMonth = new Date(prev);
			if (direction === 'prev') {
				newMonth.setMonth(prev.getMonth() - 1);
			} else {
				newMonth.setMonth(prev.getMonth() + 1);
			}
			return newMonth;
		});
	};

	const renderCalendar = () => {
		const daysInMonth = getDaysInMonth(currentMonth);
		const firstDay = getFirstDayOfMonth(currentMonth);
		const days = [];

		// Empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
		}

		// Days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
			const isSelected = isSameDay(date, selectedDate);
			const isDisabled = isDateDisabled(date);
			const isToday = isSameDay(date, new Date());

			days.push(
				<button
					key={day}
					onClick={() => handleDateClick(day)}
					disabled={isDisabled}
					className={`w-8 h-8 text-sm rounded-lg transition-colors ${isSelected
							? 'bg-indigo-500 text-white'
							: isToday
								? 'bg-indigo-500/20 text-indigo-400'
								: isDisabled
									? 'text-gray-600 cursor-not-allowed'
									: 'text-gray-300 hover:bg-dark-400'
						}`}
				>
					{day}
				</button>
			);
		}

		return days;
	};

	const actualPlaceholder = placeholder || t('common.selectDate');

	return (
		<div className={`relative ${className}`} ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="input flex items-center justify-between w-full"
			>
				<span className={selectedDate ? 'text-white' : 'text-gray-400'}>
					{selectedDate ? formatDate(selectedDate) : actualPlaceholder}
				</span>
				<Calendar className="h-5 w-5 text-gray-400" />
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 mt-2 bg-dark-500 border border-gray-700 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
					{/* Month Navigation */}
					<div className="flex items-center justify-between mb-4">
						<button
							onClick={() => navigateMonth('prev')}
							className="p-1 hover:bg-dark-400 rounded transition-colors"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<h3 className="font-medium">
							{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
						</h3>
						<button
							onClick={() => navigateMonth('next')}
							className="p-1 hover:bg-dark-400 rounded transition-colors"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>

					{/* Day Headers */}
					<div className="grid grid-cols-7 gap-1 mb-2">
						{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
							<div key={day} className="w-8 h-8 text-xs text-gray-400 flex items-center justify-center">
								{day}
							</div>
						))}
					</div>

					{/* Calendar Grid */}
					<div className="grid grid-cols-7 gap-1">
						{renderCalendar()}
					</div>
				</div>
			)}
		</div>
	);
};

export default DatePicker;