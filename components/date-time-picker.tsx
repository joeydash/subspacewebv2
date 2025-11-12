import * as React from "react";
import { CalendarClock } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils/cn";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "./ui/popover";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

interface DateTimePickerProps {
	value?: Date;
	onChange?: (value: Date | undefined) => void;
	label?: string;
	minDate?: Date;
}

export function DateTimePicker({ value, onChange, label = "Select date & time", minDate }: DateTimePickerProps) {
	const [date, setDate] = React.useState<Date | undefined>(value);
	const [isOpen, setIsOpen] = React.useState(false);

	React.useEffect(() => {
		if (value) setDate(value);
	}, [value]);

	React.useEffect(() => {
		onChange?.(date);
	}, [date]);

	const hours = Array.from({ length: 12 }, (_, i) => i + 1);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (!selectedDate) return;
		const newDate = date ? new Date(selectedDate) : new Date(selectedDate);
		if (date) newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
		setDate(newDate);
	};

	const handleTimeChange = (type: "hour" | "minute" | "ampm", value: string) => {
		if (!date) return;
		const newDate = new Date(date);
		if (type === "hour") {
			const isPM = newDate.getHours() >= 12;
			newDate.setHours((parseInt(value) % 12) + (isPM ? 12 : 0));
		} else if (type === "minute") {
			newDate.setMinutes(parseInt(value));
		} else if (type === "ampm") {
			const currentHours = newDate.getHours();
			if (value === "PM" && currentHours < 12) newDate.setHours(currentHours + 12);
			if (value === "AM" && currentHours >= 12) newDate.setHours(currentHours - 12);
		}
		setDate(newDate);
	};

	const timeDetails = {
		selectedHour: date ? (date.getHours() % 12) || 12 : undefined,
		selectedMinute: date ? date.getMinutes() : undefined,
		selectedAmPm: date ? (date.getHours() >= 12 ? "PM" : "AM") : undefined
	};

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const minDateDay = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : today;
	const isToday = date && date.toDateString() === now.toDateString();
	const isMinDateDay = date && minDate && date.toDateString() === minDate.toDateString();
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();

	const convertTo24Hour = (hour: number, ampm: string) => {
		let hour24 = hour % 12;
		if (ampm === "PM") hour24 += 12;
		if (ampm === "AM" && hour === 12) hour24 = 0;
		return hour24;
	};

	const isHourDisabled = (hour: number, ampm: string) => {
		if (isToday && !minDate) {
			const hour24 = convertTo24Hour(hour, ampm);
			return hour24 < currentHour;
		}

		if (isMinDateDay && minDate) {
			const hour24 = convertTo24Hour(hour, ampm);
			const minHour = minDate.getHours();
			return hour24 < minHour;
		}

		return false;
	};

	const isMinuteDisabled = (minute: number, hour: number, ampm: string) => {
		if (isToday && !minDate) {
			const hour24 = convertTo24Hour(hour, ampm);
			if (hour24 > currentHour) return false;
			if (hour24 < currentHour) return true;
			return minute < currentMinute;
		}

		if (isMinDateDay && minDate) {
			const hour24 = convertTo24Hour(hour, ampm);
			const minHour = minDate.getHours();
			const minMinute = minDate.getMinutes();
			if (hour24 > minHour) return false;
			if (hour24 < minHour) return true;
			return minute < minMinute;
		}

		return false;
	};

	const isAmPmDisabled = (ampm: string) => {
		if (isToday && !minDate) {
			const isPM = currentHour >= 12;
			return ampm === "AM" && isPM;
		}

		if (isMinDateDay && minDate) {
			const minIsPM = minDate.getHours() >= 12;
			return ampm === "AM" && minIsPM;
		}

		return false;
	};

	return (
		<div className='max-w-[300px]'>
			{label && <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>}
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal border-2 border-gray-600",
							!date && "text-muted-foreground"
						)}
					>
						<CalendarClock className="mr-2 h-4 w-4" />
						{date ? format(date, "MM/dd/yyyy hh:mm aa") : <span>MM/DD/YYYY hh:mm aa</span>}
					</Button>
				</PopoverTrigger>

				<PopoverContent className="w-auto p-3 bg-black text-white rounded-md z-9999 shadow-lg border border-gray-300">
					<div className="sm:flex sm:gap-3">
						<CalendarComponent
							mode="single"
							selected={date}
							onSelect={handleDateSelect}
							initialFocus
							disabled={(checkDate) => checkDate < minDateDay}
							fromDate={minDateDay}
							className="[&_.rdp-day]:min-w-[32px] [&_.rdp-day]:min-h-[32px] [&_.rdp-day]:text-sm"
							classNames={{
								weekday: "text-violet-400 rounded-md flex-1 font-normal text-[0.8rem] select-none",
							}}
						/>

						<div className="flex flex-col sm:flex-row sm:h-[280px] divide-y sm:divide-y-0 sm:divide-x divide-gray-700 mt-3 sm:mt-0 pt-3 sm:pt-0">
							<ScrollArea className="px-2">
								<div className="flex sm:flex-col py-1 gap-1">
									{hours.map((hour) => {
										const isSelected = timeDetails.selectedHour === (hour % 12 === 0 ? 12 : hour % 12);
										const currentAmPm = timeDetails.selectedAmPm || "AM";
										const disabled = isHourDisabled(hour, currentAmPm);
										return (
											<Button
												key={hour}
												size="sm"
												variant={isSelected ? "default" : "ghost"}
												disabled={disabled}
												className={cn(
													"sm:w-10 w-10 shrink-0 h-9 text-sm font-medium",
													isSelected ? "bg-violet-600 text-white hover:bg-violet-700" : "hover:bg-white/10 text-gray-300",
													disabled && "opacity-40 cursor-not-allowed"
												)}
												onClick={() => handleTimeChange("hour", hour.toString())}
											>
												{hour}
											</Button>
										);
									})}
								</div>
								<ScrollBar orientation="horizontal" className="sm:hidden" />
							</ScrollArea>

							<ScrollArea className="px-2">
								<div className="flex sm:flex-col py-1 gap-1">
									{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => {
										const display = minute < 10 ? `0${minute}` : `${minute}`;
										const isSelected = timeDetails.selectedMinute === minute;
										const currentAmPm = timeDetails.selectedAmPm || "AM";
										const disabled = isMinuteDisabled(minute, timeDetails.selectedHour || 12, currentAmPm);
										return (
											<Button
												key={minute}
												size="sm"
												variant={isSelected ? "default" : "ghost"}
												disabled={disabled}
												className={cn(
													"sm:w-10 w-10 shrink-0 h-9 text-sm font-medium",
													isSelected ? "bg-violet-600 text-white hover:bg-violet-700" : "hover:bg-white/10 text-gray-300",
													disabled && "opacity-40 cursor-not-allowed"
												)}
												onClick={() => handleTimeChange("minute", minute.toString())}
											>
												{display}
											</Button>
										);
									})}
								</div>
								<ScrollBar orientation="horizontal" className="sm:hidden" />
							</ScrollArea>

							<ScrollArea className="px-2">
								<div className="flex sm:flex-col py-1 gap-1">
									{["AM", "PM"].map((ampm) => {
										const isSelected = timeDetails.selectedAmPm === ampm;
										const disabled = isAmPmDisabled(ampm);
										return (
											<Button
												key={ampm}
												size="sm"
												variant={isSelected ? "default" : "ghost"}
												disabled={disabled}
												className={cn(
													"sm:w-10 w-10 shrink-0 h-9 text-sm font-medium",
													isSelected ? "bg-violet-600 text-white hover:bg-violet-700" : "hover:bg-white/10 text-gray-300",
													disabled && "opacity-40 cursor-not-allowed"
												)}
												onClick={() => handleTimeChange("ampm", ampm)}
											>
												{ampm}
											</Button>
										);
									})}
								</div>
							</ScrollArea>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
