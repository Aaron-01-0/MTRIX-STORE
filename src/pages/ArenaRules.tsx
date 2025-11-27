import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Gavel, AlertTriangle, CheckCircle, Trophy, Copyright } from 'lucide-react';

const ArenaRules = () => {
    return (
        <div className="min-h-screen bg-black text-white font-inter selection:bg-purple-500/30">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-black font-orbitron tracking-tighter mb-4">
                            ARENA <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">RULES</span>
                        </h1>
                        <p className="text-xl text-gray-400">Terms, Conditions & Policy Set</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                        <ScrollArea className="h-[800px] pr-6">
                            <div className="space-y-12 text-gray-300">

                                {/* Section 1 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                        <Shield className="text-purple-500" /> 1. General Terms
                                    </h2>
                                    <p className="mb-4">
                                        Welcome to MTRIX ARENA, a community-driven platform where users submit original designs to participate in weekly/monthly voting rounds.
                                        By submitting designs, voting, or participating in any form, you agree to the following Terms & Conditions.
                                    </p>
                                    <p>
                                        These Terms govern: Design submissions, Voting mechanics, Moderation rules, Coupon rewards, Intellectual property, Community behavior, Eligibility & restrictions, and Penalties & violations.
                                        <br /><br />
                                        <span className="text-red-400">If you don’t accept these terms, please do not use the MTRIX ARENA platform.</span>
                                    </p>
                                </section>

                                {/* Section 2 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                        <CheckCircle className="text-green-500" /> 2. Eligibility
                                    </h2>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Be at least 13 years old (or your country’s minimum age for online services).</li>
                                        <li>Have a valid, verified MTRIX account.</li>
                                        <li>Agree to these Terms & Conditions and the Privacy Policy.</li>
                                        <li>Submit only your OWN original works.</li>
                                    </ul>
                                </section>

                                {/* Section 3 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                        <Copyright className="text-blue-500" /> 3. Design Submission Policy
                                    </h2>
                                    <p className="mb-4">By submitting a design, you confirm that:</p>
                                    <ul className="list-disc pl-6 space-y-2 mb-4">
                                        <li>You created the artwork yourself OR you have the full legal rights/license to use all elements in it.</li>
                                        <li>No part of the design infringes any copyright, trademark, brand identity, or other third-party IP.</li>
                                    </ul>
                                    <p className="mb-2 font-semibold text-white">The design does not contain:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Pornographic content, Hate speech, Violence or self-harm themes.</li>
                                        <li>Drug promotion, Defamatory context.</li>
                                        <li>Real people’s likeness without permission.</li>
                                    </ul>
                                    <p className="mt-4 text-sm text-gray-500">
                                        You accept that your design may undergo automated scans, moderation review, and rejection if it violates guidelines. You will provide editable/source files if your design wins or is selected.
                                    </p>
                                </section>

                                {/* Section 4 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                        <AlertTriangle className="text-red-500" /> 4. Content Restrictions (Strict Rules)
                                    </h2>
                                    <p className="mb-4 font-semibold text-white">Your design must NOT include:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Logos from brands (ex: Nike, Adidas, Apple, etc.)</li>
                                        <li>Anime/TV/movie/game characters that you do not own</li>
                                        <li>Copyrighted illustrations or photos</li>
                                        <li>Celebrity faces</li>
                                        <li>Religious disrespect, sensitive political content</li>
                                        <li>Strong NSFW or adult content</li>
                                        <li>Potentially harmful, offensive, or dangerous material</li>
                                    </ul>
                                    <p className="mt-4 text-red-400 text-sm">
                                        Designs violating these rules may be removed, and accounts may be restricted.
                                    </p>
                                </section>

                                {/* Section 5 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                        <Gavel className="text-yellow-500" /> 5. Moderation & Review
                                    </h2>
                                    <p className="mb-4">All designs undergo:</p>
                                    <ul className="list-disc pl-6 space-y-2 mb-4">
                                        <li>Technical validation (resolution, file-type)</li>
                                        <li>Automated scans (NSFW, trademark, duplicates)</li>
                                        <li>Human moderation (final call)</li>
                                    </ul>
                                    <p>
                                        Moderators may: Approve, Reject (with reason), Request changes, Pause voting, Delete content, or Restrict accounts.
                                        <br />
                                        <span className="font-bold text-white">Moderator decisions are final.</span>
                                    </p>
                                </section>

                                {/* Section 6 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">6. Voting System Rules</h2>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>You must have a verified MTRIX account.</li>
                                        <li>Each user may vote once per design per voting period.</li>
                                        <li>Votes cannot be bought, transferred, automated, or manipulated.</li>
                                    </ul>
                                    <p className="mt-4 font-semibold text-white">Prohibited activities:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Fake accounts, Multiple accounts, Bot voting.</li>
                                        <li>Vote farming inorganically.</li>
                                        <li>Using VPNs or scripts to bypass limits.</li>
                                        <li>Coordinated manipulation.</li>
                                    </ul>
                                    <p className="mt-4 text-red-400 text-sm">
                                        Suspicious votes will be flagged, removed, and investigated. Your account may be banned if misuse is detected.
                                    </p>
                                </section>

                                {/* Section 7 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                        <Trophy className="text-yellow-400" /> 7. Winner Selection Rules
                                    </h2>
                                    <p className="mb-4">Winners are selected based on: Total valid votes, Minimum vote threshold, and Tie-breakers (e.g., vote velocity, unique voters).</p>
                                    <p className="mb-4">MTRIX reserves the right to:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Disqualify suspicious winners</li>
                                        <li>Promote the next highest valid design</li>
                                        <li>Remove votes identified as fraudulent</li>
                                        <li>Override results if necessary</li>
                                    </ul>
                                    <p className="mt-4 font-bold text-white">Final product selection ALWAYS requires MTRIX admin approval.</p>
                                </section>

                                {/* Section 8 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">8. Rewards (Coupon System)</h2>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Winning designers receive Coupon rewards (type, amount, expiry defined by MTRIX).</li>
                                        <li>Coupons are non-cash, non-refundable, and may be single-use or limited-use.</li>
                                        <li>Coupons must be redeemed within the provided validity period.</li>
                                        <li>Voters may also receive Voter coupons, Early access perks, or Limited-time offers.</li>
                                    </ul>
                                    <p className="mt-4 text-sm text-gray-500">MTRIX may modify or cancel coupon policies at any time.</p>
                                </section>

                                {/* Section 9 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">9. Intellectual Property (VERY IMPORTANT)</h2>
                                    <p className="mb-4">By submitting a design, you grant MTRIX a non-exclusive, worldwide, royalty-free license to:</p>
                                    <ul className="list-disc pl-6 space-y-2 mb-4">
                                        <li>Display your artwork</li>
                                        <li>Use it for voting</li>
                                        <li>Promote it across social media</li>
                                        <li>Showcase it in campaigns</li>
                                        <li>Use it in product mockups</li>
                                        <li>Produce & sell it if your design wins</li>
                                    </ul>
                                    <p className="mb-4 font-semibold text-white">If your design wins:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>You grant MTRIX the right to produce, sell, promote the design as merchandise.</li>
                                        <li>MTRIX owns the final product version, but you retain ownership of your original artwork.</li>
                                        <li>You cannot request removal or revocation of rights after production starts.</li>
                                    </ul>
                                </section>

                                {/* Section 10 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">10. Use of Submitted Designs</h2>
                                    <p className="mb-4">
                                        Even if your design doesn't win, MTRIX may keep it in your profile and display it as part of the platform experience.
                                        It will NOT be used for commercial sale without your explicit approval or winning status.
                                    </p>
                                    <p>
                                        If you want to delete your submission, you may request it unless it’s already in production or has entered a voting period.
                                    </p>
                                </section>

                                {/* Section 11 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">11. Disqualification Policy</h2>
                                    <p>
                                        MTRIX may remove designs or restrict accounts that violate rules, submit stolen art, use inappropriate content, abuse the voting system, mislead community, or attempt manipulation.
                                        <br />
                                        <span className="text-red-400">Disqualified designs receive no coupons, no rewards, and no reconsideration.</span>
                                    </p>
                                </section>

                                {/* Section 12 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">12. Liability</h2>
                                    <p>
                                        MTRIX is not responsible for lost or deleted designs, false claims by users, disputes between creators, infringements committed by submitters, or damages or losses resulting from participation.
                                        Creators bear full responsibility for submitted content.
                                    </p>
                                </section>

                                {/* Section 13 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">13. Privacy & Data Usage</h2>
                                    <p className="mb-4">
                                        When participating in Arena, MTRIX may collect: IP address, Device details, Voting history, Submission content, Behavioral data, and Account information.
                                    </p>
                                    <p>
                                        This data is used for: Anti-fraud, Personalization, Improving MTRIX, Moderation, and Reward distribution.
                                        Your data is protected under MTRIX’s Privacy Policy.
                                    </p>
                                </section>

                                {/* Section 14 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">14. Right to Modify</h2>
                                    <p>
                                        MTRIX may update Arena rules, Voting system, Coupon policies, Submission requirements, and Moderation guidelines. Any updates will be posted on the website.
                                    </p>
                                </section>

                                {/* Section 15 */}
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-4">15. Agreement</h2>
                                    <p className="text-lg font-semibold text-white">
                                        By participating in MTRIX ARENA — You agree to ALL of the above.
                                        <br />
                                        If you disagree with any part, please do not submit or vote.
                                    </p>
                                </section>

                            </div>
                        </ScrollArea>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default ArenaRules;
