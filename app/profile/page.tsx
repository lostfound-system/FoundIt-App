"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Mail, Phone, BookOpen, ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { LOCATIONS } from "@/lib/locations";
import RegionUniversitySelect from "../components/RegionUniversitySelect";
import Footer from "../components/Footer";
import { useToast } from "../components/ToastProvider";
import dynamic from "next/dynamic";

const ProfileScene = dynamic(() => import("../components/3d/ProfileScene"), { ssr: false });

export default function ProfilePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    // Location State
    const [country, setCountry] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [university, setUniversity] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");

    // Upload State


    useEffect(() => {
        let isMounted = true;

        const fetchUserProfile = async () => {
            const userEmail = localStorage.getItem("userEmail");
            if (!userEmail) {
                router.push("/");
                return;
            }
            if (isMounted) setEmail(userEmail);

            try {
                const docRef = doc(db, "users", userEmail);
                const docSnap = await getDoc(docRef);

                if (isMounted && docSnap.exists()) {
                    const data = docSnap.data();
                    setName(data.name || "");
                    setPhone(data.phoneNumber || "");
                    setUniversity(data.university || "");
                    setCountry(data.country || "");
                    setState(data.state || "");
                    setCity(data.city || "");
                    setPhotoUrl(data.photoUrl || "");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchUserProfile();

        return () => { isMounted = false; };
    }, [router]);



    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: Compulsory Fields
        if (!name.trim()) {
            showToast("Username is required.", "error");
            return;
        }
        if (!phone || phone.replace(/\D/g, '').length < 10) {
            showToast("Please enter a valid contact number (at least 10 digits).", "error");
            return;
        }

        setSaving(true);

        try {
            await updateDoc(doc(db, "users", email), {
                name,
                phoneNumber: phone,
                university,
                country,
                state,
                city,
                updatedAt: serverTimestamp()
            });

            // Update local storage for immediate UI updates elsewhere
            localStorage.setItem("userName", name);

            showToast("Profile updated successfully!", "success");
        } catch (error) {
            console.error("Error saving profile:", error);
            showToast("Failed to save profile.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col pt-16 relative">
            {/* 3D IDENTITY HUD BACKGROUND */}
            <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
                <ProfileScene />
            </div>

            <div className="flex-1 w-full max-w-5xl mx-auto p-4 z-10">

                {/* Header / Back */}
                <div className="flex items-center gap-4 mb-2">
                    <Link href="/dashboard" className="p-2 rounded-xl bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                </div>

                <div className="bg-white dark:glass p-6 rounded-3xl border border-gray-200 dark:border-white/10 animate-fade-in shadow-sm dark:shadow-none">
                    <form onSubmit={handleSave}>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Left Column: Photo & Personal Info */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* Profile Photo */}
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-100 dark:border-white/10 shadow-2xl bg-gray-100 dark:bg-black/40">
                                            {photoUrl ? (
                                                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                                    <User className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Inputs */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            disabled
                                            className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            <Phone className="w-4 h-4 text-green-600 dark:text-green-400" /> Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="Enter your phone number"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Location Settings */}
                            <div className="lg:col-span-7 flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-pink-600 dark:text-pink-400" /> Education & Region
                                </h3>
                                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/5 flex-1">
                                    <RegionUniversitySelect
                                        country={country} setCountry={setCountry}
                                        state={state} setState={setState}
                                        city={city} setCity={setCity}
                                        university={university} setUniversity={setUniversity}
                                        required
                                    />
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Save Profile <Save className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}
