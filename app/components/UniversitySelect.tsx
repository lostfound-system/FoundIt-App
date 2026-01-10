"use client";

import { UNIVERSITIES } from "@/lib/constants";
import { ChevronDown } from "lucide-react";

interface UniversitySelectProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export default function UniversitySelect({ value, onChange, required }: UniversitySelectProps) {
    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                University / Campus <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    className="w-full appearance-none bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3.5 pl-4 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all cursor-pointer"
                >
                    <option value="" disabled className="bg-white dark:bg-gray-900 text-gray-500">Select your university</option>
                    {UNIVERSITIES.map((uni) => (
                        <option key={uni} value={uni} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                            {uni}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
}
