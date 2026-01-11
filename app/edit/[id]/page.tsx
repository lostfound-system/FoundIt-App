"use client";

import { useState, useActionState, useEffect, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateItem } from "../../actions";
import { ArrowLeft, Loader2, MapPin, FileText, Phone, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RegionUniversitySelect from "../../components/RegionUniversitySelect";
import { CATEGORIES } from "@/lib/constants";
import { LOCATIONS } from "@/lib/locations";
import * as LucideIcons from "lucide-react";

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [description, setDescription] = useState("");
    const [university, setUniversity] = useState("");
    const [country, setCountry] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");

    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [contact, setContact] = useState("");
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState("lost");

    const [stateAction, formAction, isPending] = useActionState(updateItem, null);

    // Fetch Item Data
    useEffect(() => {
        const fetchItem = async () => {
            try {
                const itemRef = doc(db, "items", id);
                const itemSnap = await getDoc(itemRef);

                if (itemSnap.exists()) {
                    const data = itemSnap.data();
                    setDescription(data.description || "");
                    const uni = data.university || "";
                    setUniversity(uni);
                    setCategory(data.category || "");
                    setLocation(data.location || "");
                    setContact(data.contact || "");
                    setType(data.type || "lost");

                    // Reverse lookup location if missing
                    let foundLocation = false;
                    if (data.country && data.state && data.city) {
                        setCountry(data.country);
                        setState(data.state);
                        setCity(data.city);
                        foundLocation = true;
                    } else if (uni) {
                        // Attempt to find university in LOCATIONS
                        for (const [c, states] of Object.entries(LOCATIONS)) {
                            for (const [s, cities] of Object.entries(states)) {
                                for (const [ci, unis] of Object.entries(cities)) {
                                    if (unis.includes(uni)) {
                                        setCountry(c);
                                        setState(s);
                                        setCity(ci);
                                        foundLocation = true;
                                        break;
                                    }
                                }
                                if (foundLocation) break;
                            }
                            if (foundLocation) break;
                        }
                    }

                    // Auth Check: Ensure user owns this item
                    const userEmail = localStorage.getItem("userEmail");
                    if (!userEmail) { // Basic check, ideally check contact info too
                        router.push("/");
                    }
                } else {
                    router.push("/dashboard");
                }
            } catch (error) {
                console.error("Error fetching item:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [id, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    const isLost = type === 'lost';

    return (
        <div className="min-h-screen p-4 md:p-6 pb-20 bg-gray-50 dark:bg-[#0a0a0a]">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 rounded-xl bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Edit <span className={isLost ? "text-pink-600 dark:text-pink-500" : "text-purple-600 dark:text-purple-500"}>
                                {isLost ? "Lost Item" : "Found Item"}
                            </span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">Update the details of your report.</p>
                    </div>
                </div>

                <form action={formAction} className="space-y-8 animate-fade-in">
                    <input type="hidden" name="id" value={id} />
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
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
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
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
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
                        disabled={isPending || !university || !category || !description}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Updating...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" /> Update Report
                            </>
                        )}
                    </button>
                    {stateAction?.message && (
                        <p className="text-red-400 text-center text-sm bg-red-500/10 p-2 rounded-lg">{stateAction.message}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
