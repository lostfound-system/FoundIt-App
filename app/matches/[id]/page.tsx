"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { findMatches } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, MapPin, User, Search, Phone, Mail, ShieldCheck, ExternalLink } from "lucide-react";

interface MatchCandidate {
    id: string;
    description: string;
    imageUrl: string;
    location: string;
    contact: string;
    email?: string;
    userName?: string; // Added field
    contactType?: 'email' | 'phone';
    matchType: string;
    university: string;
}

export default function MatchesPage() {
    const params = useParams();
    const itemId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
    const [confirmedMatch, setConfirmedMatch] = useState<MatchCandidate | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingCandidate, setPendingCandidate] = useState<MatchCandidate | null>(null);

    useEffect(() => {
        if (!itemId) return;

        const fetchCandidates = async () => {
            try {
                const results = await findMatches(itemId);
                setCandidates(results as MatchCandidate[]);
            } catch (error) {
                console.error("Failed to find matches", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, [itemId]);

    const handleConfirmMatch = async (candidate: MatchCandidate) => {
        setConfirmedMatch(candidate);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-purple-900/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-900/10 blur-[150px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <header className="mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:scale-105 active:scale-95">
                            <ArrowLeft className="w-5 h-5 text-gray-300" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Match Suggestions</h1>
                            <p className="text-gray-500 text-sm mt-1">AI-powered analysis of reported items.</p>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Search className="w-6 h-6 text-purple-500/50" />
                            </div>
                        </div>
                        <p className="text-gray-400 animate-pulse">Scanning database for semantically similar items...</p>
                    </div>
                ) : candidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                            <Search className="w-10 h-10 text-gray-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">No matches found yet</h2>
                        <p className="text-gray-400 max-w-md mb-8">
                            We couldn't find any items that strongly match your description right now. We'll keep looking and notify you!
                        </p>
                        <Link href="/dashboard" className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                            Return to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {candidates.map((candidate) => {
                            const isConfirmed = confirmedMatch?.id === candidate.id;
                            const isBlurred = confirmedMatch && !isConfirmed;

                            return (
                                <div
                                    key={candidate.id}
                                    className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${isConfirmed
                                        ? 'bg-gradient-to-br from-purple-900/40 to-black border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-[1.02]'
                                        : isBlurred
                                            ? 'opacity-30 blur-sm scale-95 border-white/5 bg-white/5'
                                            : 'bg-white/5 border-white/10 hover:border-purple-500/30 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Content Section */}
                                        <div className="flex-1 p-8 flex flex-col justify-center">
                                            {isConfirmed ? (
                                                <div className="animate-in fade-in zoom-in duration-500 space-y-6">

                                                    {/* Header with Match Badge & Safe Tips */}
                                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                                        <div className="flex items-center gap-3 text-emerald-400">
                                                            <div className="p-2 bg-emerald-500/20 rounded-full">
                                                                <Check className="w-6 h-6" />
                                                            </div>
                                                            <span className="text-xl font-bold">It's a Match!</span>
                                                        </div>

                                                        {/* Safe Return Tips (Moved Here) */}
                                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3 max-w-sm">
                                                            <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-blue-200 text-xs font-bold mb-1">Safe Return Tips</p>
                                                                <p className="text-blue-300 text-[10px] leading-tight">Meet in a public place (e.g. {candidate.university} Campus Security).</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-2xl font-bold text-white mb-4">{candidate.description}</h3>
                                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                                            <p className="text-gray-400 text-sm uppercase font-bold tracking-widest mb-4">Owner Contact Details</p>

                                                            <div className="space-y-4">
                                                                {/* User Profile Info */}
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                                                                        <User className="w-6 h-6" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white font-bold text-lg">{candidate.userName || "FoundIt User"}</p>
                                                                        <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                                                                            <ShieldCheck className="w-3 h-3" /> Verified Member
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="h-px bg-white/10" />

                                                                {/* Contact Methods */}
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${candidate.contactType === 'phone' ? 'bg-pink-500/20 text-pink-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                                        {candidate.contactType === 'phone' ? <Phone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white font-mono text-lg font-medium">{candidate.contact}</p>
                                                                        <p className="text-gray-500 text-xs">{candidate.contactType === 'phone' ? 'Verified Phone / WhatsApp' : 'Verified Email'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4 pt-2">
                                                        <button
                                                            onClick={() => window.location.href = `mailto:${candidate.email || candidate.contact}`}
                                                            className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            Contact via Email
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmedMatch(null)}
                                                            className="px-6 py-3 rounded-xl border border-white/20 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="mb-6">
                                                        <h3 className="text-2xl font-bold text-white mb-2">{candidate.description}</h3>
                                                        <div className="flex items-center gap-4 text-gray-400 text-sm">
                                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg">
                                                                <MapPin className="w-3.5 h-3.5" /> {candidate.location}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg">
                                                                <ExternalLink className="w-3 h-3" /> {candidate.university}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 mt-auto">
                                                        <button
                                                            onClick={() => handleConfirmMatch(candidate)}
                                                            disabled={!!confirmedMatch}
                                                            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/25 transition-all w-full md:w-auto flex items-center justify-center gap-2"
                                                        >
                                                            <Check className="w-5 h-5" /> This looks correct
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
