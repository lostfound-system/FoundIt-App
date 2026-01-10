"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Eye, EyeOff, ArrowRight, UserPlus, LogIn, Mail, Lock, Bell, Sparkles, ShieldCheck } from "lucide-react";
import { useToast } from "./components/ToastProvider";

export default function LoginPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false); // Added for forgot password UI state

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState(""); // For Signup
    const [error, setError] = useState("");

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userRef = doc(db, "users", user.email!);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                await setDoc(userRef, {
                    name: user.displayName,
                    email: user.email,
                    photoUrl: user.photoURL,
                    createdAt: serverTimestamp(),
                    lostCount: 0,
                    foundCount: 0,
                    phoneNumber: user.phoneNumber || null
                });
            }

            localStorage.setItem("userEmail", user.email!);
            localStorage.setItem("userName", user.displayName || "User");

            if (user.email?.toLowerCase() === "foundit.connect@gmail.com") {
                localStorage.setItem("adminEmail", user.email!);
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }

        } catch (error: any) {
            console.error("Login failed", error);
            setError("Google Sign-In failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Domain Validation
        const allowedDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
        const emailDomain = email.split('@')[1];

        // Admin Bypass for foundit.connect@gmail.com / gamil.com
        const isAdminEmail = email.toLowerCase() === "foundit.connect@gmail.com" || email.toLowerCase() === "foundit.connect@gamil.com";

        if (!emailDomain || (!allowedDomains.includes(emailDomain) && !isAdminEmail)) {
            setError("Please use an authorized email provider (Gmail, Yahoo, Hotmail, etc).");
            setIsLoading(false);
            return;
        }

        try {
            if (activeTab === 'login') {
                // LOGIN FLOW
                const normalizedEmail = email.toLowerCase();
                // Allow "gamil" typo or correct "gmail"
                if ((normalizedEmail === "foundit.connect@gmail.com" || normalizedEmail === "foundit.connect@gamil.com") && password === "#FoundIt*by@TECHtitans") {
                    localStorage.setItem("userEmail", normalizedEmail);
                    localStorage.setItem("userName", "Admin User");
                    localStorage.setItem("adminEmail", normalizedEmail);
                    router.push("/admin");
                    return;
                }

                const result = await signInWithEmailAndPassword(auth, email, password);
                const user = result.user;

                localStorage.setItem("userEmail", user.email!);

                const userRef = doc(db, "users", user.email!);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    localStorage.setItem("userName", docSnap.data().name);
                }

                router.push("/dashboard");

            } else {
                // SIGNUP FLOW
                const result = await createUserWithEmailAndPassword(auth, email, password);
                const user = result.user;

                await updateProfile(user, { displayName: name });

                // Create User Doc
                await setDoc(doc(db, "users", user.email!), {
                    name: name,
                    email: user.email,
                    photoUrl: null,
                    createdAt: serverTimestamp(),
                    lostCount: 0,
                    foundCount: 0,
                    phoneNumber: null
                });

                localStorage.setItem("userEmail", user.email!);
                localStorage.setItem("userName", "New User"); // Placeholder until profile update

                router.push("/profile"); // Redirect to Profile to complete setup
            }

        } catch (error: any) {
            console.error("Auth error", error);
            if (activeTab === 'login') {
                setError("Invalid email or password.");
            } else {
                setError(error.message || "Failed to create account.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-[#0a0a0a] overflow-hidden font-sans">
            {/* LEFT COLUMN: BRANDING */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-center items-center p-12 overflow-hidden bg-gray-50 dark:bg-gradient-to-br dark:from-[#0a0a0a] dark:to-[#111]">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-pink-600/10 blur-[100px] animate-pulse delay-1000" />
                </div>

                <div className="relative z-10 text-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/20 mx-auto transform hover:scale-105 transition-transform duration-500">
                        <Sparkles className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                        Found<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">It!</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-xl font-light mb-8 max-w-md mx-auto leading-relaxed">
                        The premium network for lost & found items. Connect, recover, and resolve with confidence.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl glass bg-white/5 border border-white/5 w-32">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            <span className="text-xs text-gray-300 font-medium">Verified Users</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl glass bg-white/5 border border-white/5 w-32">
                            <Bell className="w-6 h-6 text-purple-400" />
                            <span className="text-xs text-gray-300 font-medium">Instant Alerts</span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-8 flex items-center gap-2 opacity-50">
                    <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">N</div>
                    <span className="text-[10px] text-gray-500">Powered by TechTitans • Version 1.0</span>
                </div>
            </div>

            {/* RIGHT COLUMN: FORM */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-[#0a0a0a] relative">
                <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {activeTab === 'login'
                                ? 'Enter your credentials to access your dashboard.'
                                : 'Join the community and start recovering and returning items.'}
                        </p>
                    </div>

                    {/* TABS */}
                    <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-8 border border-gray-200 dark:border-white/10">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'login' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setActiveTab('signup')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'signup' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        {/* Full Name removed from Signup as per request */}

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-600 dark:group-focus-within:text-white transition-colors" />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-white/10 transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-600 dark:group-focus-within:text-white transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3.5 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-white/10 transition-all text-sm"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {activeTab === 'login' && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!email) {
                                            setError("Please enter your email address to reset password.");
                                            return;
                                        }
                                        try {
                                            await sendPasswordResetEmail(auth, email);
                                            showToast(`Password reset email sent to ${email}. Please check your inbox (and spam folder).`, "success");
                                            setShowForgotPassword(false);
                                        } catch (error: any) {
                                            console.error("Error sending password reset email:", error);
                                            showToast("Failed to send password reset email. Please try again.", "error");
                                        }
                                    }}
                                    className="text-xs text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                        >
                            {activeTab === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] font-bold tracking-widest uppercase">
                            <span className="px-4 text-gray-500 bg-[#0a0a0a]">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
