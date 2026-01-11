"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trash2, MapPin, LogOut, LayoutDashboard, List, CheckCircle, Search, PieChart, Users, Box, Check, User, Notebook, ShieldCheck, CheckCircle2, AlertCircle, Package, History, Filter, X, ChevronRight, Database, BarChart3, TrendingUp, MoreVertical, Menu } from "lucide-react";
import { useToast } from "../components/ToastProvider";
import { resolveMatch, resolveItem, deleteItem, deleteUserAndData } from "../actions";

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
    resolvedAt?: any; // New field
    resolutionNote?: string; // New field for "Found by X" or "Returned to Y"
    tags?: string[];
}

interface UserData {
    id: string; // email or phone
    name?: string;
    email?: string;
    phoneNumber?: string; // Added field
    createdAt?: any;
    lostCount: number;
    foundCount: number;
}

interface MergedItemPair {
    type: 'pair';
    lost: Item;
    found: Item;
    score: number;
}

interface MergedItemSingle {
    type: 'single';
    item: Item;
}

type HistoryEntry = MergedItemPair | MergedItemSingle;

const STOP_WORDS = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'it', 'is', 'are', 'was', 'were', 'my', 'i', 'lost', 'found', 'item']);

const calculateSimilarity = (str1: string, str2: string): number => {
    const tokenize = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    const set1 = new Set(tokenize(str1));
    const set2 = new Set(tokenize(str2));

    if (set1.size === 0 || set2.size === 0) return 0;

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
};

export default function AdminPage() {
    const [email, setEmail] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'users' | 'history'>('dashboard');
    const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
    const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'user'>('all'); // NEW: User Filter State
    const [selectedItemUser, setSelectedItemUser] = useState<{ item: Item, user: UserData | undefined } | null>(null);
    const [selectedHistoryPair, setSelectedHistoryPair] = useState<MergedItemPair | null>(null); // NEW: Pair Modal State
    const [selectedItemDetail, setSelectedItemDetail] = useState<Item | null>(null); // NEW: Item Detail Modal State
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        const storedEmail = localStorage.getItem("adminEmail") || "";
        // Case-insensitive check (handling potential typo 'gamil')
        const normalizedEmail = storedEmail.toLowerCase();
        if (!storedEmail || (normalizedEmail !== "foundit.connect@gmail.com" && normalizedEmail !== "foundit.connect@gamil.com")) {
            router.push("/");
        } else {
            setEmail(storedEmail);
            fetchData();
        }
    }, [router]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Items
            const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const fetchedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
            setItems(fetchedItems);

            // 2. Fetch Users & Aggregate Data
            const usersSnap = await getDocs(collection(db, "users"));
            const fetchedUsers = usersSnap.docs.map(doc => {
                const data = doc.data();
                const userId = doc.id; // This is email or phone

                // Count items for this user (matching by contact info)
                const userItems = fetchedItems.filter(item =>
                    item.contact.toLowerCase() === userId.toLowerCase() ||
                    (data.email && item.contact.toLowerCase() === data.email.toLowerCase()) ||
                    (data.phoneNumber && item.contact === data.phoneNumber) // Added Phone Match
                );

                return {
                    id: userId,
                    ...data,
                    lostCount: userItems.filter(i => i.type === 'lost').length,
                    foundCount: userItems.filter(i => i.type === 'found').length
                } as UserData;
            });

            setUsers(fetchedUsers.sort((a, b) => {
                // 1. Admin always on top
                const isAdminA = a.email?.toLowerCase() === "foundit.connect@gmail.com" || a.email?.toLowerCase() === "foundit.connect@gamil.com";
                const isAdminB = b.email?.toLowerCase() === "foundit.connect@gmail.com" || b.email?.toLowerCase() === "foundit.connect@gamil.com";

                if (isAdminA) return -1;
                if (isAdminB) return 1;

                // 2. Sort by Created At (Desc - Newest First)
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            }));

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived History (Solved Cases) - Updates automatically when items change
    const mergedHistory = useMemo(() => {
        const resolvedList = items.filter(i => i.status === 'resolved');
        const lostItems = resolvedList.filter(i => i.type === 'lost');
        const foundItems = resolvedList.filter(i => i.type === 'found');

        const usedFoundIds = new Set<string>();
        const newHistory: HistoryEntry[] = [];

        // Attempt to find matches for every Lost item
        lostItems.forEach(lost => {
            let bestMatch: Item | null = null;
            let bestScore = 0;

            foundItems.forEach(found => {
                if (usedFoundIds.has(found.id)) return;

                const text1 = `${lost.description} ${lost.category} ${lost.university}`;
                const text2 = `${found.description} ${found.category} ${found.university}`;
                const score = calculateSimilarity(text1, text2);

                if (score > 0.2 && score > bestScore) {
                    bestScore = score;
                    bestMatch = found;
                }
            });

            if (bestMatch) {
                newHistory.push({ type: 'pair', lost, found: bestMatch, score: bestScore });
                usedFoundIds.add((bestMatch as Item).id);
            } else {
                newHistory.push({ type: 'single', item: lost });
            }
        });

        // Add remaining Found items
        foundItems.forEach(found => {
            if (!usedFoundIds.has(found.id)) {
                newHistory.push({ type: 'single', item: found });
            }
        });

        return newHistory;
    }, [items]);

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure? This will delete the user and ALL their items permanently.")) return;
        setIsLoading(true);
        try {
            await deleteUserAndData(userId);
            // Optimistic Update or Refresh
            setUsers(prev => prev.filter(u => u.id !== userId));
            showToast("User deleted successfully.", "success");
            // Also need to remove items from local state if we want perfect sync, but ensuring Users tab is updated is key
        } catch (error) {
            console.error("Failed to delete user:", error);
            showToast("Failed to delete user.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (itemId: string) => {
        if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
            // Optimistic UI
            setItems(items.filter(item => item.id !== itemId));
            try {
                await deleteItem(itemId);
                showToast("Item deleted successfully.", "success");
            } catch (error) {
                console.error("Failed to delete item:", error);
                showToast("Failed to delete item.", "error");
                fetchData(); // Revert
            }
        }
    };

    const handleResolve = async (itemId: string, type: "lost" | "found") => {
        const action = type === 'lost' ? "Found By (Finder's Name/Email)" : "Returned To (Owner's Name/Email)";
        const note = prompt(`Marking as Resolved.\n\nWho was this item ${type === 'lost' ? 'found by' : 'returned to'}?`, "Unknown / Anonymous");

        if (note !== null) {
            // Optimistic Update
            const now = new Date();
            setItems(items.map(item => item.id === itemId ? { ...item, status: 'resolved', resolvedAt: { seconds: now.getTime() / 1000 }, resolutionNote: note } : item));

            try {
                const itemRef = doc(db, "items", itemId);
                await updateDoc(itemRef, {
                    status: 'resolved',
                    resolvedAt: serverTimestamp(), // Will need to import serverTimestamp
                    resolutionNote: note
                });
            } catch (error) {
                console.error("Failed to resolve item:", error);
                fetchData(); // Revert
            }
        }
    };

    // Helper to find user by contact
    const findUserByContact = (contact: string) => {
        return users.find(u =>
            u.id.toLowerCase() === contact.toLowerCase() ||
            (u.email && u.email.toLowerCase() === contact.toLowerCase()) ||
            (u.phoneNumber && u.phoneNumber === contact) // Added Phone Match
        );
    };

    const handleViewUser = (item: Item) => {
        const user = findUserByContact(item.contact);
        setSelectedItemUser({ item, user });
    };

    const handleLogout = () => {
        localStorage.removeItem("userEmail");
        localStorage.removeItem("adminEmail"); // Clear admin access
        router.push("/");
    };

    // Derived Stats
    const totalItems = items.length;
    const solvedCount = mergedHistory.length; // Uses Merged History Count
    const activeLost = items.filter(i => i.type === 'lost' && i.status !== 'resolved').length;
    const activeFound = items.filter(i => i.type === 'found' && i.status !== 'resolved').length;

    // Helper to get relative time
    const getRelativeTime = (seconds: number) => {
        if (!seconds) return "Just now";
        return new Date(seconds * 1000).toLocaleDateString();
    };

    // Loading State
    if (!email) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden font-sans">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/5 flex flex-col z-20 hidden md:flex">
                <div className="p-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                        Admin<span className="text-purple-500">Panel</span>
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'users' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Users className="w-5 h-5" /> Users
                    </button>
                    <button
                        onClick={() => { setActiveTab('items'); setFilterType('all'); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'items' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <List className="w-5 h-5" /> All Items
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'history' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Notebook className="w-5 h-5" /> History
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
                    >
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
                {/* HEADER */}
                <header className="h-20 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-8 bg-white/80 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-10 w-full">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{activeTab} Overview</h1>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {/* USER DETAIL MODAL */}
                    {selectedHistoryPair && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedHistoryPair(null)}>
                            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setSelectedHistoryPair(null)} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white z-10">
                                    <span className="text-2xl">×</span>
                                </button>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-emerald-400" /> Resolution Match Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                                    {/* Connector Line (Desktop) */}
                                    <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-purple-500/50 to-transparent hidden md:block"></div>
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1a1a1a] p-2 rounded-full border border-purple-500/50 text-purple-400 hidden md:block z-10">
                                        <span className="font-bold text-xs">{Math.round(selectedHistoryPair.score * 100)}% Match</span>
                                    </div>

                                    {/* LEFT: LOST ITEM */}
                                    {/* Images Removed from Modal */}

                                    {/* RIGHT: FOUND ITEM */}
                                </div>

                                {/* Details Comparison */}
                                <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                                    {/* ... existing details ... */}
                                    <div className="p-4 bg-pink-500/5 space-y-4 border-r border-gray-200 dark:border-white/10">
                                        <div className="pb-4 border-b border-gray-200 dark:border-white/5">
                                            <p className="text-[10px] font-bold text-pink-400 uppercase mb-1">Owner (Receiver)</p>
                                            <p className="text-lg text-gray-900 dark:text-white font-bold">{findUserByContact(selectedHistoryPair.lost.contact)?.name || "Unknown User"}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{findUserByContact(selectedHistoryPair.lost.contact)?.email || "No Email"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-pink-400 uppercase mb-1">Description</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedHistoryPair.lost.description}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Tags</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedHistoryPair.lost.tags?.map((t: string) => (
                                                    <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-500 uppercase">Location</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300">{selectedHistoryPair.lost.location}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-500 uppercase">Contact</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300 break-all">{selectedHistoryPair.lost.contact}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-500/5 space-y-4">
                                        <div className="pb-4 border-b border-gray-200 dark:border-white/5">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Finder</p>
                                            <p className="text-lg text-gray-900 dark:text-white font-bold">{findUserByContact(selectedHistoryPair.found.contact)?.name || "Unknown User"}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{findUserByContact(selectedHistoryPair.found.contact)?.email || "No Email"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Description</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedHistoryPair.found.description}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Tags</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedHistoryPair.found.tags?.map((t: string) => (
                                                    <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-500 uppercase">Location</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300">{selectedHistoryPair.found.location}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-500 uppercase">Contact</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300 break-all">{selectedHistoryPair.found.contact}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {selectedItemUser && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedItemUser(null)}>
                            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setSelectedItemUser(null)} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                    <span className="text-2xl">×</span>
                                </button>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-purple-400" /> User Details
                                </h3>

                                <div className="space-y-6">
                                    {/* Context: Item */}
                                    <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Reported Item</p>
                                        <p className="text-gray-900 dark:text-white font-medium">{selectedItemUser.item.description}</p>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-2 inline-block ${selectedItemUser.item.type === 'lost' ? 'bg-pink-500/10 text-pink-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {selectedItemUser.item.type}
                                        </span>
                                    </div>

                                    {/* User Info */}
                                    <div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                                                {selectedItemUser.user?.name?.[0] || selectedItemUser.item.contact[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedItemUser.user?.name || "Anonymous User"}</h4>
                                                {selectedItemUser.user?.email && (
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedItemUser.user.email}</p>
                                                )}
                                                <p className="text-gray-500 text-xs">{selectedItemUser.user?.phoneNumber || selectedItemUser.item.contact}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-center">
                                                <p className="text-xs text-pink-400 uppercase font-bold">Lost Reports</p>
                                                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedItemUser.user?.lostCount || 0}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                                                <p className="text-xs text-emerald-400 uppercase font-bold">Found Reports</p>
                                                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedItemUser.user?.foundCount || 0}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 text-center">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                This user
                                                <span className={selectedItemUser.item.type === 'lost' ? 'text-pink-400' : 'text-emerald-400'}>
                                                    {selectedItemUser.item.type === 'lost' ? ' LOST ' : ' FOUND '}
                                                </span>
                                                the item.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* ITEM DETAIL MODAL */}
                    {selectedItemDetail && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedItemDetail(null)}>
                            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setSelectedItemDetail(null)} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white z-10">
                                    <span className="text-2xl">×</span>
                                </button>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    {selectedItemDetail.type === 'lost' ? <Search className="text-pink-400" /> : <Box className="text-emerald-400" />}
                                    {selectedItemDetail.type === 'lost' ? 'Lost Item Details' : 'Found Item Details'}
                                </h3>
                                <span className="text-xs text-gray-500 block mb-6">
                                    ID: {selectedItemDetail.id}
                                </span>

                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Description</p>
                                            <p className="text-gray-900 dark:text-white text-lg font-medium">{selectedItemDetail.description}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Category</p>
                                                <p className="text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 px-2 py-1 rounded inline-block text-sm">{selectedItemDetail.category}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Date</p>
                                                <p className="text-gray-900 dark:text-white text-sm">{new Date(selectedItemDetail.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Location</p>
                                            <div className="flex items-center gap-2 text-gray-900 dark:text-white text-sm">
                                                <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                {selectedItemDetail.location} ({selectedItemDetail.university})
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Contact</p>
                                            <div className="flex items-center gap-2 text-gray-900 dark:text-white bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                                                <User className="w-4 h-4 text-blue-400" />
                                                {selectedItemDetail.contact}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                                        {selectedItemDetail.status !== 'resolved' && (
                                            <button
                                                onClick={() => {
                                                    handleResolve(selectedItemDetail.id, selectedItemDetail.type);
                                                    setSelectedItemDetail(null);
                                                }}
                                                className="n-full flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-5 h-5" /> Mark Resolved
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                handleDelete(selectedItemDetail.id);
                                                setSelectedItemDetail(null);
                                            }}
                                            className="py-3 px-6 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold transition-all border border-red-500/20 flex items-center justify-center"
                                            title="Delete Item"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dashboard' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Overview</h2>
                                <p className="text-gray-500 dark:text-gray-400">Platform statistics and activity</p>
                            </div>

                            {/* STATS GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatsCard
                                    title="Total Users"
                                    value={users.length}
                                    icon={Users}
                                    color="blue"
                                    onClick={() => setActiveTab('users')}
                                />
                                <StatsCard
                                    title="Active Lost"
                                    value={activeLost}
                                    icon={Search}
                                    color="pink"
                                    onClick={() => { setActiveTab('items'); setFilterType('lost'); }}
                                />
                                <StatsCard
                                    title="Active Found"
                                    value={activeFound}
                                    icon={Box}
                                    color="emerald"
                                    onClick={() => { setActiveTab('items'); setFilterType('found'); }}
                                />
                                <StatsCard
                                    title="Solved (History)"
                                    value={solvedCount}
                                    icon={CheckCircle}
                                    color="purple"
                                    onClick={() => setActiveTab('history')}
                                />
                            </div>

                            {/* CHARTS / VISUALS */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/5 flex flex-col">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <PieChart className="w-5 h-5 text-purple-400" /> Item Distribution (By Category)
                                    </h3>
                                    {/* ... Logic for distribution (preserve) ... */}
                                    <div className="flex-1 flex flex-col justify-center w-full min-h-[200px]">
                                        {/* Category Progress List */}
                                        {(() => {
                                            const categoryCounts: Record<string, number> = {};
                                            items.forEach(i => {
                                                const cat = i.category || 'Other';
                                                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                                            });

                                            const sortedCategories = Object.entries(categoryCounts)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 5);

                                            const maxCount = Math.max(...Object.values(categoryCounts), 1);

                                            if (sortedCategories.length === 0) return <div className="w-full text-center text-gray-500 py-10">No data available</div>;

                                            return (
                                                <div className="w-full space-y-4">
                                                    {sortedCategories.map(([cat, count], idx) => (
                                                        <div key={cat} className="group">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors capitalize">
                                                                    {cat}
                                                                </span>
                                                                <span className="text-xs font-bold text-gray-500 group-hover:text-purple-400 transition-colors">
                                                                    {count} items
                                                                </span>
                                                            </div>
                                                            <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-500 ease-out group-hover:brightness-125"
                                                                    style={{
                                                                        width: `${(count / maxCount) * 100}%`,
                                                                        background: `linear-gradient(90deg, hsl(${280 + (idx * 15)}, 70%, 50%), hsl(${300 + (idx * 15)}, 70%, 50%))`
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/5 flex flex-col justify-center items-center text-center space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2 self-start">
                                        <CheckCircle className="w-5 h-5 text-emerald-400" /> Resolution Rate
                                    </h3>

                                    <div className="relative w-48 h-48 flex items-center justify-center">
                                        {/* Conic Gradient Pie Chart */}
                                        <div
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                background: `conic-gradient(
                                                #a855f7 0% ${totalItems > 0 ? (solvedCount / totalItems) * 100 : 0}%, 
                                                rgba(255, 255, 255, 0.1) ${totalItems > 0 ? (solvedCount / totalItems) * 100 : 0}% 100%
                                            )`,
                                                boxShadow: '0 0 30px rgba(168, 85, 247, 0.2)'
                                            }}
                                        />
                                        {/* Inner Circle for Donut Effect */}
                                        <div className="absolute inset-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-full flex flex-col items-center justify-center z-10">
                                            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                                                {totalItems > 0 ? Math.round((solvedCount / totalItems) * 100) : 0}%
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Solved</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-8 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                            <span className="text-gray-500 dark:text-gray-400">Solved ({solvedCount})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-white/10"></div>
                                            <span className="text-gray-500 dark:text-gray-400">Open ({totalItems - solvedCount})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'users' ? (
                        // USERS LIST VIEW
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Users Directory</h2>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <select
                                            value={userFilter}
                                            onChange={(e) => setUserFilter(e.target.value as 'all' | 'admin' | 'user')}
                                            className="appearance-none bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-medium rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                                        >
                                            <option value="all" className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">All Users</option>
                                            <option value="admin" className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">Admin Users</option>
                                            <option value="user" className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">Registered Users</option>
                                        </select>
                                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-white/5 rounded-xl overflow-hidden border border-gray-200 dark:border-white/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                                            <tr>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Contact ID</th>
                                                <th className="px-6 py-4">Phone</th>
                                                <th className="px-6 py-4">Joined</th>
                                                <th className="px-6 py-4 text-center">Lost</th>
                                                <th className="px-6 py-4 text-center">Found</th>
                                                <th className="px-6 py-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                            {users.filter(u => {
                                                if (userFilter === 'all') return true;
                                                const isAdmin = u.email?.toLowerCase() === "foundit.connect@gmail.com" || u.email?.toLowerCase() === "foundit.connect@gamil.com";
                                                if (userFilter === 'admin') return isAdmin;
                                                if (userFilter === 'user') return !isAdmin;
                                                return true;
                                            }).map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {/* Image Removed as per request, just showing generic placeholder or nothing? Keeping Initials context if needed but removing image source binding */}
                                                            {/* <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-purple-400 font-bold">
                                                            {user.name?.[0] || <User className="w-5 h-5" />}
                                                        </div> */}
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                    {user.name || "Anonymous"}
                                                                    {(user.email?.toLowerCase() === "foundit.connect@gmail.com" || user.email?.toLowerCase() === "foundit.connect@gamil.com") && (
                                                                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 uppercase tracking-wide font-bold">Admin</span>
                                                                    )}
                                                                </div>
                                                                {/* Email Removed from display as per request */}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-400 text-sm">
                                                        {user.id}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-400 text-sm">{user.phoneNumber || "N/A"}</td>
                                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-400 text-sm">
                                                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${user.lostCount > 0 ? 'bg-pink-500/20 text-pink-400' : 'text-gray-600'}`}>
                                                            {user.lostCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${user.foundCount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-600'}`}>
                                                            {user.foundCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {users.filter(u => {
                                    if (userFilter === 'all') return true;
                                    const isAdmin = u.email?.toLowerCase() === "foundit.connect@gmail.com" || u.email?.toLowerCase() === "foundit.connect@gamil.com";
                                    if (userFilter === 'admin') return isAdmin;
                                    if (userFilter === 'user') return !isAdmin;
                                    return true;
                                }).length === 0 && !isLoading && (
                                        <div className="p-8 text-center text-gray-500">No users found matching filter.</div>
                                    )}
                            </div>
                        </div>
                    ) : activeTab === 'history' ? (
                        // HISTORY VIEW (MERGED GRID)
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Success History</h2>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    <span className="text-purple-400 font-bold">{mergedHistory.filter(h => h.type === 'pair').length}</span> Merged Paired
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mergedHistory.length === 0 ? (
                                    <div className="col-span-full p-20 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
                                        No resolved items history found.
                                    </div>
                                ) : mergedHistory.map((entry, idx) => {
                                    if (entry.type === 'pair') {
                                        const lostUser = findUserByContact(entry.lost.contact);
                                        const foundUser = findUserByContact(entry.found.contact);

                                        // RENDER PAIR CARD
                                        return (
                                            <div
                                                key={`pair-${idx}`}
                                                onClick={() => setSelectedHistoryPair(entry)}
                                                className="group relative bg-white dark:bg-white/5 p-1 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform duration-300 border border-purple-500/30"
                                            >
                                                {/* Gradient Border Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-emerald-500/20 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                                                <div className="relative bg-white dark:bg-[#0a0a0a] rounded-xl p-4 h-full flex flex-col">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> Merged Match
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-500">{Math.round(entry.score * 100)}% Sim</span>
                                                    </div>

                                                    <div className="flex gap-2 mb-4">
                                                        {/* Text Only View */}
                                                        <div className="flex-1 p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                                            <p className="text-[10px] text-pink-400 font-bold uppercase mb-1">Owner (Receiver)</p>
                                                            <p className="text-sm text-gray-900 dark:text-white font-bold mb-1 truncate">{lostUser?.name || "Unknown"}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{entry.lost.description}</p>
                                                        </div>
                                                        <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                            <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Finder</p>
                                                            <p className="text-sm text-gray-900 dark:text-white font-bold mb-1 truncate">{foundUser?.name || "Unknown"}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{entry.found.description}</p>
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate mt-auto">
                                                        <MapPin className="w-3 h-3" /> {entry.lost.university}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // RENDER SINGLE CARD
                                        const user = findUserByContact(entry.item.contact);
                                        return (
                                            <div key={entry.item.id} className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/5 opacity-75 hover:opacity-100 transition-opacity">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${entry.item.type === 'lost' ? 'bg-pink-500/10 text-pink-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                        {entry.item.type}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">{new Date(entry.item.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                                </div>

                                                <div className="mb-3">
                                                    <p className="text-sm text-gray-900 dark:text-white font-bold">{user?.name || "Unknown User"}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || entry.item.contact}</p>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-gray-700 dark:text-gray-300 truncate text-sm">{entry.item.description}</h4>
                                                        <p className="text-[10px] text-gray-600 truncate mt-1">Resolved: {entry.item.resolutionNote || "No notes"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    ) : (
                        // ALL ITEMS VIEW
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">All Items (System History)</h2>
                                    {/* DROPDOWN FILTER */}
                                    <div className="relative">
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value as 'all' | 'lost' | 'found')}
                                            className="appearance-none bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white pl-4 pr-10 py-2 rounded-xl focus:outline-none focus:border-purple-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <option value="all" className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">Every Item</option>
                                            <option value="lost" className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">Lost Items Only</option>
                                            <option value="found" className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">Found Items Only</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="text-center py-20 text-gray-500">Loading...</div>
                            ) : (
                                // GRID LAYOUT
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items
                                        .filter(i => filterType === 'all' ? true : i.type === filterType)
                                        .map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedItemDetail(item)}
                                                className={`bg-white dark:bg-white/5 p-5 rounded-2xl flex flex-col gap-4 border transition-all cursor-pointer hover:scale-[1.02] ${item.status === 'resolved' ? 'border-purple-500/30 bg-purple-500/5' : 'border-gray-200 dark:border-white/5 hover:border-purple-500/30'}`}
                                            >
                                                {/* Header */}
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.type === 'lost' ? 'bg-pink-500/10 text-pink-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                        {item.type}
                                                    </span>
                                                    {item.status === 'resolved' ? (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> Resolved
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">
                                                            {getRelativeTime(item.createdAt?.seconds)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">{item.description}</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded inline-block mb-3">{item.category}</p>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate">{item.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <User className="w-3 h-3" />
                                                            <span className="truncate">{item.contact}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    {items.filter(i => (filterType === 'all' || i.type === filterType)).length === 0 && (
                                        <div className="col-span-full p-20 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
                                            No {filterType} items found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color, onClick }: { title: string, value: number, icon: any, color: string, onClick?: () => void }) {
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        green: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };

    return (
        <div
            onClick={onClick}
            className={`p-6 rounded-2xl border ${colors[color]} bg-white dark:bg-transparent backdrop-blur-sm transition-transform hover:scale-105 shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${colors[color].split(' ')[0]} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors[color]}`}>
                    +12%
                </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>
    );
}

