"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Search, Target, Eye, Sparkles } from "lucide-react";
import Footer from "../components/Footer";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-screen overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-900/10 blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-10 pb-20">
                {/* Header Actions */}
                <div className="mb-12">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                </div>

                {/* Hero Section */}
                <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-gray-400">
                        About FoundIt!
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Reimagining how lost items are recovered on campus through community collaboration and smart technology.
                    </p>
                </div>

                {/* Vision & Mission Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-24">
                    {/* Vision */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all" />
                        
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                            <Eye className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                        <p className="text-gray-400 leading-relaxed">
                            To create a seamless, stress-free campus environment where lost items always find their way back home, fostering a culture of honesty and mutual support.
                        </p>
                    </div>

                    {/* Mission */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-pink-500/20 transition-all" />
                        
                        <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 text-pink-400 group-hover:scale-110 transition-transform">
                            <Target className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                        <p className="text-gray-400 leading-relaxed">
                            Leveraging modern technology to connect people and their belongings with speed, security, and simplicity, reducing the anxiety of loss.
                        </p>
                    </div>
                </div>

                {/* Future Functionalities (Moved from Dashboard) */}
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <div className="glass p-10 rounded-3xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-yellow-400" />
                                Future Roadmap
                            </h2>
                            <p className="text-gray-400 mb-8">Exciting features we are building to make FoundIt! even better.</p>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Feature 1 */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Mail className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Smart Notifications</h3>
                                    <p className="text-sm text-gray-400">Get instant alerts via Email & SMS when a match is found.</p>
                                    <span className="inline-block mt-4 text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded tracking-wider border border-purple-500/20">In Development</span>
                                </div>
                                {/* Feature 2 */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-pink-500/30 transition-all group">
                                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Search className="w-6 h-6 text-pink-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Image Recognition AI</h3>
                                    <p className="text-sm text-gray-400">Auto-match lost items by simply uploading a photo.</p>
                                    <span className="inline-block mt-4 text-[10px] uppercase font-bold text-pink-400 bg-pink-500/10 px-2 py-1 rounded tracking-wider border border-pink-500/20">Coming Soon</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
