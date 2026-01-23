"use client";

import { useState, useActionState, useEffect, Suspense } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "@/lib/firebase";
import { createItem } from "../actions";
import { Upload, Loader2, MapPin, FileText, Phone, ArrowLeft, Send } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import RegionUniversitySelect from "../components/RegionUniversitySelect";
import { CATEGORIES } from "@/lib/constants";
import * as LucideIcons from "lucide-react";
import dynamicImport from "next/dynamic";

const SubmitScene = dynamicImport(() => import("../components/3d/SubmitScene"), { ssr: false });

export const dynamic = 'force-dynamic';

function SubmitForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get("type") || "lost";
    const isLost = type === 'lost';

    const [university, setUniversity] = useState("");
    const [country, setCountry] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");

    const [category, setCategory] = useState("");
    const [contact, setContact] = useState("");

    // Removed unused image state

    const [stateAction, formAction, isPending] = useActionState(createItem, null);

    // Auth Check & Prefill Data
    useEffect(() => {
        const userEmail = localStorage.getItem("userEmail");
        if (!userEmail) {
            router.push("/");
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const { doc, getDoc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");

                const userDoc = await getDoc(doc(db, "users", userEmail));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.phoneNumber) setContact(userData.phoneNumber);
                    if (userData.university) setUniversity(userData.university);
                    if (userData.country) setCountry(userData.country);
                    if (userData.state) setState(userData.state);
                    if (userData.city) setCity(userData.city);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };

        fetchUserProfile();
    }, [router]);

    return (
        <div className="min-h-screen p-4 md:p-6 pb-20 relative overflow-hidden">
            {/* 3D SCANNER BACKGROUND */}
            <div className="fixed inset-0 w-full h-full -z-10">
                <SubmitScene mode={isLost ? 'lost' : 'found'} />
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 rounded-xl bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Report <span className={isLost ? "text-pink-600 dark:text-pink-500" : "text-purple-600 dark:text-purple-500"}>
                                {isLost ? "Lost Item" : "Found Item"}
                            </span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">Fill in the details to find a match.</p>
                    </div>
                </div>

                <form action={formAction} className="space-y-8 animate-fade-in">
                    <input type="hidden" name="type" value={type} />

                    {/* Section 1: Classification */}
                    <div className="bg-white dark:glass p-6 rounded-2xl space-y-6 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">1</span>
                            Classification
                        </h2>

                        <div className="space-y-6">
                            <RegionUniversitySelect
                                country={country} setCountry={setCountry}
                                state={state} setState={setState}
                                city={city} setCity={setCity}
                                university={university} setUniversity={setUniversity}
                                required
                            />
                            <input type="hidden" name="university" value={university} />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category <span className="text-red-500 dark:text-red-400">*</span></label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {CATEGORIES.map((cat) => {
                                        // @ts-ignore
                                        const Icon = LucideIcons[cat.icon] || LucideIcons.Box;
                                        const isSelected = category === cat.id;

                                        return (
                                            <div
                                                key={cat.id}
                                                onClick={() => setCategory(cat.id)}
                                                className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col items-center gap-3 text-center ${isSelected
                                                    ? 'bg-purple-100 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-white'
                                                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-white/30 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <Icon className={`w-6 h-6 ${isSelected ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                                                <span className="text-sm font-medium">{cat.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <input type="hidden" name="category" value={category} />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Details */}
                    <div className="bg-white dark:glass p-6 rounded-2xl space-y-6 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm">2</span>
                            Details
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description <span className="text-red-500 dark:text-red-400">*</span></label>
                                <div className="relative">
                                    <FileText className="absolute top-3 left-3 w-5 h-5 text-gray-500 dark:text-gray-500" />
                                    <textarea
                                        name="description"
                                        placeholder={`Describe the ${type === 'lost' ? 'lost' : 'found'} item in detail...`}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none h-32 resize-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specific Location</label>
                                <div className="relative">
                                    <MapPin className="absolute top-3 left-3 w-5 h-5 text-gray-500 dark:text-gray-500" />
                                    <input
                                        type="text"
                                        name="location"
                                        placeholder="e.g. Library, 2nd Floor, Table 4"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Info <span className="text-red-500 dark:text-red-400">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute top-3 left-3 w-5 h-5 text-gray-500 dark:text-gray-500" />
                                    <input
                                        type="text"
                                        name="contact"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        placeholder="Phone number or Email"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending || !university || !category}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" /> Submit Report
                            </>
                        )}
                    </button>
                    {stateAction?.message && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-center animate-fade-in">
                            {stateAction.message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default function SubmitPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>}>
            <SubmitForm />
        </Suspense>
    );
}
