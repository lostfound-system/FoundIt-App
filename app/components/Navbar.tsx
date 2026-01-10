"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, LogOut, Moon, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        // Force Dark Mode
        document.documentElement.classList.add("light"); // Ensure light class is removed first if present from prev session
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
        localStorage.setItem("theme", "dark");

        // Fetch User Data for Menu
        // We re-run this whenever pathname changes to ensure we catch login/updates
        const email = localStorage.getItem("userEmail");
        const storedName = localStorage.getItem("userName");

        if (email) {
            if (isMounted) {
                setUserEmail(email);
                setUserName(storedName);
            }

            // Fetch latest photo/name from Firestore
            const fetchUser = async () => {
                try {
                    const docSnap = await getDoc(doc(db, "users", email));
                    if (isMounted && docSnap.exists()) {
                        const data = docSnap.data();
                        setUserPhoto(data.photoUrl || null);
                        setUserName(data.name || storedName);
                    }
                } catch (e) {
                    console.error("Nav fetch error", e);
                }
            };
            fetchUser();
        } else {
            // Clear if no user (e.g. after logout)
            if (isMounted) {
                setUserEmail(null);
                setUserName(null);
                setUserPhoto(null);
            }
        }

        return () => { isMounted = false; };
    }, [pathname]); // Added pathname dependency


    const handleLogout = () => {
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("adminEmail"); // Clear admin access
        router.push("/");
    };

    return (
        <nav className="fixed top-0 w-full z-50 glass-nav">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Search className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">
                        Found<span className="text-gradient">It!</span>
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    {/* Profile Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center hover:border-purple-500/50 transition-all overflow-hidden"
                        >
                            {userPhoto ? (
                                <img src={userPhoto} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-purple-400" />
                            )}
                        </button>

                        {/* Dropdown */}
                        {isMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsMenuOpen(false)}
                                />
                                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                                        <p className="text-gray-900 dark:text-white font-bold truncate">{userName || "User"}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail || "No Email"}</p>
                                    </div>
                                    <div className="p-2">
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <User className="w-4 h-4" /> My Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
