import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AlertTriangle, CheckCircle, Mail, ShieldAlert, Video } from "lucide-react";

const Returns = () => {
    return (
        <div className="min-h-screen bg-black text-white font-inter selection:bg-gold/30">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6 max-w-4xl">
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-gradient-gold">
                            Return & Refund Policy
                        </h1>
                        <p className="text-muted-foreground">Last updated: December 3, 2025</p>
                    </div>

                    <div className="prose prose-invert max-w-none space-y-12">
                        {/* Intro */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-lg leading-relaxed text-gray-300">
                                At MTRIX, we create minimal, aesthetic, made-on-order products designed to elevate your space.
                                Since every item is printed exclusively for you, we follow a clear and fair return policy to ensure transparency and smooth experience.
                            </p>
                        </div>

                        {/* 1. Made-to-Order */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                                <span className="text-gold">01.</span> Made-to-Order Products
                            </h2>
                            <div className="pl-4 border-l-2 border-gold/50 space-y-4">
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex gap-3 items-start">
                                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-1" />
                                    <p className="text-red-200 text-sm">
                                        All MTRIX products are printed only after you place an order, so we do not accept returns for change of mind, wrong size/variant chosen, minor color variations, or styling preference issues.
                                    </p>
                                </div>
                                <p className="text-gray-400 italic">Each product is handcrafted for you — so please choose carefully before ordering.</p>
                            </div>
                        </section>

                        {/* 2. Replacement */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                                <span className="text-gold">02.</span> When You Can Request a Replacement
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {['Product arrived damaged', 'Wrong product delivered', 'Defective print / manufacturing issue', 'Order lost in transit'].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                                <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                                    <Video className="w-4 h-4" /> Condition:
                                </h3>
                                <p className="text-blue-200 text-sm mb-2">To approve any replacement, you must share:</p>
                                <ul className="list-disc list-inside text-blue-200/80 text-sm space-y-1">
                                    <li>Full unboxing video (from opening the parcel seal to showing the product)</li>
                                    <li>Photos of the defect/wrong item</li>
                                    <li>Original packaging</li>
                                </ul>
                            </div>
                        </section>

                        {/* 3. Unboxing Video */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                                <span className="text-gold">03.</span> Unboxing Video Requirement
                            </h2>
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <p className="text-gray-300 mb-4">
                                    Because MTRIX products undergo multiple quality checks, we need unboxing proof for any claim.
                                </p>
                                <div className="flex items-center gap-3 text-red-400 font-medium bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                    <ShieldAlert className="w-5 h-5" />
                                    Without a proper unboxing video, replacement/refund cannot be issued.
                                </div>
                            </div>
                        </section>

                        {/* 4. Not Eligible */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                                <span className="text-gold">04.</span> Cases Not Eligible for Return/Refund
                            </h2>
                            <ul className="grid gap-3">
                                {[
                                    'Wrong size/model ordered by customer',
                                    'Slight color difference due to screen brightness vs real print',
                                    'Customer not available / Wrong address',
                                    '“I didn’t like it” / “I changed my mind” cases',
                                    'Absence of unboxing video proof',
                                    'Size tolerance difference of ±0.5 inches'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-2" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* 5. RTO */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                                <span className="text-gold">05.</span> RTO (Return to Origin) Policy
                            </h2>
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <p className="text-gray-300 mb-4">
                                    If your parcel returns due to customer unavailability, wrong address, or COD refusal, the product will be added to our Return Inventory for <span className="text-gold font-bold">100 days</span>.
                                </p>
                                <p className="text-sm text-gray-400">
                                    You may reship it anytime by paying the shipping fee.
                                </p>
                            </div>
                        </section>

                        {/* 6. Reshipment */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                                <span className="text-gold">06.</span> Reshipment Charges
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {['₹20 handling fee per product', '18% GST', 'Courier shipping cost'].map((item, i) => (
                                    <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* 7. Refund Policy */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                                <span className="text-gold">07.</span> Refund Policy
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-white">Issued When:</h3>
                                    <ul className="space-y-2 text-gray-400 text-sm">
                                        <li>• Product is damaged/wrong AND unboxing proof is valid</li>
                                        <li>• Product is lost in transit</li>
                                        <li>• Out-of-stock after order is placed</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-white">Processed Via:</h3>
                                    <ul className="space-y-2 text-gray-400 text-sm">
                                        <li>• Original payment method</li>
                                        <li>• Store credit (your preference)</li>
                                        <li className="text-gold">• Time: 5–7 working days</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 8. How to Raise */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                                <span className="text-gold">08.</span> How to Raise a Request
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-r from-gold/10 to-transparent p-6 rounded-xl border border-gold/20 flex items-center gap-4">
                                    <div className="bg-gold/20 p-3 rounded-full">
                                        <Mail className="w-6 h-6 text-gold" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Email Us</h3>
                                        <a href="mailto:noa@mtrix.store" className="text-gold hover:underline block mb-1">noa@mtrix.store</a>
                                        <p className="text-xs text-gray-400">Response: 24–48 hours</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex items-center gap-4">
                                    <div className="bg-white/10 p-3 rounded-full">
                                        <ShieldAlert className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">In-Store Support</h3>
                                        <a href="/support" className="text-gold hover:underline block mb-1">Visit Support Center</a>
                                        <p className="text-xs text-gray-400">Raise a ticket directly</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-gray-400 text-sm mt-4">
                                Include: Order ID, Issue description, Unboxing video, Photos
                            </p>
                        </section>

                        {/* 9. Quick Tips */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                                <span className="text-gold">09.</span> Quick Tips to Avoid Hassle
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    'Double-check address & phone number',
                                    'Choose prepaid for smoother delivery',
                                    'Record unboxing video ALWAYS',
                                    'Verify color/size details before ordering',
                                    'Read product descriptions carefully'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-gold" />
                                        <span className="text-sm text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 10. Promise */}
                        <section className="space-y-6 pt-8 border-t border-white/10">
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl font-orbitron font-bold text-white">MTRIX Promise</h2>
                                <p className="text-gray-400 max-w-2xl mx-auto">
                                    We’re a small, design-driven brand — every order matters to us. We guarantee honest support, transparent policies, and quality-driven products.
                                </p>
                                <p className="text-gold font-medium">
                                    We keep it real — you’ll get what you ordered, and if something goes wrong, we fix it fast.
                                </p>
                                <p className="text-xl font-bold tracking-widest text-white mt-4">SIMPLE. MINIMAL. MTRIX.</p>
                            </div>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Returns;
