import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="mt-20 border-t border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/20 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                            Found<span className="text-gradient">It!</span>
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                            The smartest way to track lost and found items across campus.
                            Powered by TechTitans to connect you with your belongings instantly.
                        </p>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <a href="mailto:foundIt.connect@gmail.com" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                                    foundIt.connect@gmail.com
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                <MapPin className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                <span className="text-gray-600 dark:text-gray-400">Ahmedabad, Gujarat</span>
                            </li>
                        </ul>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Quick Links</h3>
                        <div className="flex flex-col gap-2">
                            <Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Dashboard</Link>
                            <Link href="/submit?type=lost" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Report Lost</Link>
                            <Link href="/submit?type=found" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Report Found</Link>
                            <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">About & Vision</Link>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                    <p>© {new Date().getFullYear()} FoundIt! Network. All rights reserved.</p>
                    <div className="flex gap-6">
                        <span className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</span>
                        <span className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
