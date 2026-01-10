"use client";

import Link from "next/link";
import { PlusCircle, Search, User, Loader2, Edit, Check, CheckCircle2, AlertCircle, MapPin, Calendar, Clock, Trash2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "../components/ToastProvider";

interface Item {
    id: string;
    type: "lost" | "found";
    description: string;
    imageUrl: string;
    location: string;
    university: string;
    category: string;
    contact: string;
    createdAt: any;
    status: "open" | "resolved";
    resolvedAt?: any;
    resolutionNote?: string;
    otherParty?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [userName, setUserName] = useState<string | null>(null);
    const [showNameModal, setShowNameModal] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [phoneInput, setPhoneInput] = useState(""); // Add Phone State
    const [loadingName, setLoadingName] = useState(true);
    const [savingName, setSavingName] = useState(false);

    // New State for Items
    const [myItems, setMyItems] = useState<Item[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const email = localStorage.getItem("userEmail");
            if (!email) {
                router.push("/");
                return;
            }

            try {
                // Check Firestore for existing user profile
                const userDocRef = doc(db, "users", email);
                const userSnap = await getDoc(userDocRef);

                let currentPhone = "";

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setUserName(userData.name);
                    currentPhone = userData.phoneNumber; // Capture phone for query

                    // ONE-TIME MIGRATION / ENFORCEMENT
                    // If user has a name but NO phone number, force them to add it.
                    if (!userData.phoneNumber) {
                        setNameInput(userData.name); // Prefill existing name
                        setShowNameModal(true);
                    }
                } else {
                    // No profile found, ask for name
                    setShowNameModal(true);
                }

                // FETCH USER ITEMS
                // Check against both Email AND Phone Number (if available)
                const contactMethods = [email];
                if (currentPhone) {
                    contactMethods.push(currentPhone);
                }

                // Use 'in' query to find items where contact matches ANY of the user's identifiers
                const q = query(
                    collection(db, "items"),
                    where("contact", "in", contactMethods)
                );

                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));

                // Sort in memory to avoid Firestore Index creation requirement
                const sortedItems = items.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });

                setMyItems(sortedItems); // FIXED: Do not filter out resolved items here!

            } catch (error) {
                console.error("Error fetching user/items:", error);
                // Fallback to local storage if offline
                const localName = localStorage.getItem("userName");
                if (localName) setUserName(localName);
                else setShowNameModal(true);
            } finally {
                setLoadingName(false);
                setLoadingItems(false);
            }
        };

        checkUser();
    }, [router]);

    const handleSaveName = async (newName: string, newPhone: string) => {
        if (!newName.trim()) return;
        const email = localStorage.getItem("userEmail");
        if (!email) return;

        setSavingName(true);
        try {
            // Save to Firestore
            await setDoc(doc(db, "users", email), {
                name: newName,
                email: email,
                phoneNumber: newPhone, // Save phone number
                createdAt: serverTimestamp(),
                lostCount: 0,
                foundCount: 0
            });

            // Save locally as well
            localStorage.setItem("userName", newName); // Use newName
            setUserName(newName); // Use newName
            setShowNameModal(false);

            // Refresh logic to ensure new phone number is picked up by queries
            window.location.reload();
        } catch (error) {
            console.error("Error creating profile:", error); // Updated error message
            alert("Failed to save name. Please try again.");
        } finally {
            setSavingName(false);
        }
    };

    const [dashboardTab, setDashboardTab] = useState<'active' | 'history'>('active');
    const [resolvingItem, setResolvingItem] = useState<Item | null>(null);
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
    const [potentialMatches, setPotentialMatches] = useState<Set<string>>(new Set());
    const [showMatchPopup, setShowMatchPopup] = useState(false);

    useEffect(() => {
        const checkMatches = async () => {
            if (myItems.length === 0) return;

            const lostItems = myItems.filter(i => i.type === 'lost' && i.status === 'open');
            const newMatches = new Set<string>();

            await Promise.all(lostItems.map(async (item) => {
                try {
                    const q = query(
                        collection(db, "items"),
                        where("type", "==", "found"),
                        where("university", "==", item.university),
                        where("category", "==", item.category),
                        where("status", "==", "open")
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        newMatches.add(item.id);
                    }
                } catch (e) {
                    console.error("Error checking matches:", e);
                }
            }));

            if (newMatches.size > 0) {
                setPotentialMatches(newMatches);
                setShowMatchPopup(true);
            }
        };

        checkMatches();
    }, [myItems]);

    const handleUserResolve = async (item: Item, otherPartyDetail: string = "") => {
        const isLost = item.type === 'lost';

        // Optimistic Update
        setMyItems(myItems.map(i => i.id === item.id ? { ...i, status: 'resolved' } : i));
        setResolvingItem(null); // Close Modal

        try {
            const itemRef = doc(db, "items", item.id);

            const note = isLost
                ? `Received from: ${otherPartyDetail || "Unknown"}`
                : `Returned to: ${otherPartyDetail || "Unknown"}`;

            await updateDoc(itemRef, {
                status: 'resolved',
                resolvedAt: serverTimestamp(),
                resolutionNote: note,
                otherParty: otherPartyDetail // Specific field for indexing/querying later
            });
            alert("History updated successfully!");
        } catch (error) {
            console.error("Error resolving item:", error);
            alert("Something went wrong. Please try again.");
            // Revert would go here, but complex with state.
        }
    };

    return (
        <div className="min-h-screen flex flex-col pt-20">
            <div className="flex-1 w-full max-w-5xl mx-auto p-6">

                {/* Username Modal */}
                {showNameModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass p-8 rounded-3xl w-full max-w-md text-center border border-white/10 shadow-2xl">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Welcome to FoundIt!</h2>
                            <p className="text-gray-400 mb-6">Let's set up your profile to get started.</p>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none text-center font-bold text-lg placeholder:font-normal"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                />
                                <input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none text-center font-bold text-lg placeholder:font-normal"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={() => {
                                    if (nameInput && phoneInput) {
                                        handleSaveName(nameInput, phoneInput);
                                    } else {
                                        showToast("Please enter both name and phone number.", "error");
                                    }
                                }}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl mt-6 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                )}

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 animate-fade-in">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">
                            {loadingName ? (
                                <span className="animate-pulse bg-white/10 rounded-lg text-transparent">Welcome, Loading...</span>
                            ) : (
                                <>Welcome, <span className="text-gradient">{userName || "Friend"}</span>!</>
                            )}
                        </h1>
                        <p className="text-gray-400">What would you like to do today?</p>
                    </div>
                </header>

                {/* MAIN ACTIONS */}
                <div className="grid md:grid-cols-2 gap-6 animate-fade-in delay-100 mb-16">
                    {/* Report Lost Item */}
                    <Link href="/submit?type=lost" className="group relative overflow-hidden rounded-3xl p-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative glass h-full p-8 rounded-[22px] hover:bg-black/40 transition-colors">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:text-white group-hover:bg-white/20 transition-all">
                                <PlusCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">I Lost Something</h2>
                            <p className="text-gray-400 bg-transparent">
                                Can't find your item? Report it here so others can help you find it.
                            </p>
                        </div>
                    </Link>

                    {/* Report Found Item */}
                    <Link href="/submit?type=found" className="group relative overflow-hidden rounded-3xl p-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 to-orange-600 opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative glass h-full p-8 rounded-[22px] hover:bg-black/40 transition-colors">
                            <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 text-pink-400 group-hover:text-white group-hover:bg-white/20 transition-all">
                                <Search className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">I Found Something</h2>
                            <p className="text-gray-600 dark:text-gray-400 bg-transparent">
                                Found an item? Report it here to help return it to its owner.
                            </p>
                        </div>
                    </Link>
                </div>



                {/* MY REPORTS SECTION */}
                <div className="animate-fade-in delay-200">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-purple-400" /> My Active Reports
                    </h2>

                    {/* TABS */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => setDashboardTab('active')}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${dashboardTab === 'active' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            Active Reports
                        </button>
                        <button
                            onClick={() => setDashboardTab('history')}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${dashboardTab === 'history' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            Resolution History
                        </button>
                    </div>

                    {loadingItems ? (
                        <div className="text-center py-10 text-gray-500">Loading your items...</div>
                    ) : dashboardTab === 'active' ? (
                        // ACTIVE ITEMS LIST
                        myItems.filter(i => i.status !== 'resolved').length === 0 ? (
                            <div className="glass p-8 rounded-2xl text-center border-dashed border-2 border-white/10">
                                <p className="text-gray-400">You haven't reported any active items yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {myItems.filter(i => i.status !== 'resolved').map(item => (
                                    <div key={item.id} className="glass p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-5 border border-white/5 hover:border-purple-500/30 transition-all">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.type === 'lost' ? 'bg-pink-500/10 text-pink-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    {item.type}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                </span>
                                                {/* MATCH FOUND BADGE */}
                                                {potentialMatches.has(item.id) && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                                                        <AlertCircle className="w-3 h-3" /> Potential Match
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1">{item.description}</h3>
                                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                                At {item.university} • {item.category}
                                            </p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Link
                                                href={`/matches/${item.id}`}
                                                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Search className="w-5 h-5" /> Matches
                                            </Link>
                                            <Link
                                                href={`/edit/${item.id}`}
                                                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Edit className="w-5 h-5" /> Edit
                                            </Link>
                                            <button
                                                onClick={() => setResolvingItem(item)}
                                                className={`px-5 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${item.type === 'lost'
                                                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-emerald-500/20'
                                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/20'
                                                    }`}
                                            >
                                                <Check className="w-5 h-5" />
                                                {item.type === 'lost' ? "I Found It!" : "Returned"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // HISTORY ITEMS LIST (GRID + EXPANDABLE)
                        myItems.filter(i => i.status === 'resolved').length === 0 ? (
                            <div className="glass p-8 rounded-2xl text-center border-dashed border-2 border-white/10">
                                <p className="text-gray-400">No resolved history yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myItems.filter(i => i.status === 'resolved').map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                                        className={`glass p-5 rounded-2xl border border-white/5 transition-all cursor-pointer hover:bg-white/5 ${expandedHistoryId === item.id ? 'ring-2 ring-purple-500/50 bg-white/5 col-span-1 md:col-span-2' : ''}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400`}>
                                                        RESOLVED
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.type === 'lost' ? 'bg-pink-500/10 text-pink-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-200 mb-1">{item.description}</h3>
                                                <p className="text-xs text-gray-500">
                                                    Resolved on: {item.resolvedAt ? new Date(item.resolvedAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="p-2 rounded-full bg-white/5">
                                                {expandedHistoryId === item.id ? <CheckCircle2 className="w-5 h-5 text-purple-400" /> : <div className="w-5 h-5" />}
                                            </div>
                                        </div>

                                        {/* EXPANDED DETAILS */}
                                        {expandedHistoryId === item.id && (
                                            <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Location & Category</p>
                                                        <p className="text-white text-sm mb-1">{item.university}</p>
                                                        <p className="text-gray-400 text-sm">{item.category}</p>
                                                    </div>

                                                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                                                        <p className="text-xs text-purple-300 uppercase font-bold mb-2">
                                                            {item.type === 'lost' ? 'Finder Details' : 'Receiver Details'}
                                                        </p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-bold">
                                                                    {item.otherParty || "Unknown Name"}
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    {item.resolutionNote || "No additional notes."}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* RESOLUTION MODAL */}
                    {resolvingItem && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="glass p-6 rounded-3xl w-full max-w-md border border-purple-500/30">
                                <h3 className="text-xl font-bold text-white mb-4">
                                    {resolvingItem.type === 'lost' ? 'Great! You found it?' : 'Excellent! Returned to owner?'}
                                </h3>

                                <div className="space-y-4 mb-6">
                                    <p className="text-gray-400 text-sm">Please provide details to complete the history log.</p>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                            {resolvingItem.type === 'lost' ? 'Who returned it to you?' : 'Who did you give it to?'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Name or Email (Optional)"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                            id="otherPartyInput"
                                        />
                                    </div>

                                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-300 text-xs">
                                        <AlertCircle className="w-4 h-4 inline mr-2" />
                                        This will mark the item as resolved and move it to history.
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setResolvingItem(null)}
                                        className="flex-1 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('otherPartyInput') as HTMLInputElement;
                                            handleUserResolve(resolvingItem, input.value);
                                        }}
                                        className="flex-1 py-3 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MATCH ALERT POPUP */}
                    {showMatchPopup && (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                            <div className="glass p-8 rounded-3xl w-full max-w-sm border border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)] text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

                                <div className="w-16 h-16 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto mb-6 animate-pulse">
                                    <AlertCircle className="w-8 h-8" />
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2">Good News!</h3>
                                <p className="text-gray-300 mb-8">
                                    We found <span className="font-bold text-yellow-400">{potentialMatches.size} potential match{potentialMatches.size > 1 ? 'es' : ''}</span> for your lost items while you were away.
                                </p>

                                <button
                                    onClick={() => setShowMatchPopup(false)}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform"
                                >
                                    View Matches
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div >
    );
}
