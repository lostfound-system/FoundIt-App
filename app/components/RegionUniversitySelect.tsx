"use client";

import { useState, useEffect } from "react";
import { LOCATIONS } from "@/lib/locations";
import { MapPin, Building2, Globe } from "lucide-react";

interface RegionUniversitySelectProps {
    country: string;
    setCountry: (val: string) => void;
    state: string;
    setState: (val: string) => void;
    city: string;
    setCity: (val: string) => void;
    university: string;
    setUniversity: (val: string) => void;
    required?: boolean;
}

export default function RegionUniversitySelect({
    country, setCountry,
    state, setState,
    city, setCity,
    university, setUniversity,
    required
}: RegionUniversitySelectProps) {

    // Derived lists based on selection
    const states = country ? Object.keys(LOCATIONS[country] || {}) : [];
    const cities = (country && state) ? Object.keys(LOCATIONS[country][state] || {}) : [];
    const universities = (country && state && city) ? LOCATIONS[country][state][city] || [] : [];

    // Reset dependents on change
    const handleCountryChange = (val: string) => {
        setCountry(val);
        setState("");
        setCity("");
        setUniversity("");
    };

    const handleStateChange = (val: string) => {
        setState(val);
        setCity("");
        setUniversity("");
    };

    const handleCityChange = (val: string) => {
        setCity(val);
        setUniversity("");
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Country & State Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Globe className="w-3 h-3 inline mr-1 text-blue-500 dark:text-blue-400" /> Country
                    </label>
                    <div className="relative">
                        <select
                            value={country}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            required={required}
                            className="w-full appearance-none bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                        >
                            <option value="" disabled className="bg-white dark:bg-gray-900 text-gray-500">Select Country</option>
                            {Object.keys(LOCATIONS).map((c) => (
                                <option key={c} value={c} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* State */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <MapPin className="w-3 h-3 inline mr-1 text-green-600 dark:text-green-400" /> State
                    </label>
                    <div className="relative">
                        <select
                            value={state}
                            onChange={(e) => handleStateChange(e.target.value)}
                            required={required}
                            disabled={!country}
                            className="w-full appearance-none bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled className="bg-white dark:bg-gray-900 text-gray-500">Select State</option>
                            {states.map((s) => (
                                <option key={s} value={s} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* City & University Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* City */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Building2 className="w-3 h-3 inline mr-1 text-yellow-500 dark:text-yellow-400" /> City
                    </label>
                    <div className="relative">
                        <select
                            value={city}
                            onChange={(e) => handleCityChange(e.target.value)}
                            required={required}
                            disabled={!state}
                            className="w-full appearance-none bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled className="bg-white dark:bg-gray-900 text-gray-500">Select City</option>
                            {cities.map((c) => (
                                <option key={c} value={c} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* University */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        University / Campus <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={university}
                            onChange={(e) => setUniversity(e.target.value)}
                            required={required}
                            disabled={!city}
                            className="w-full appearance-none bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled className="bg-white dark:bg-gray-900 text-gray-500">Select University</option>
                            {universities.map((u) => (
                                <option key={u} value={u} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{u}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
