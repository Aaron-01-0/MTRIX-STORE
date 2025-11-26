import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DropHero from "@/components/drop/DropHero";
import DropSpotlight from "@/components/drop/DropSpotlight";
import DropVideo from "@/components/drop/DropVideo";
import DropSocialProof from "@/components/drop/DropSocialProof";
import DropReels from "@/components/drop/DropReels";
import DropStory from "@/components/drop/DropStory";

const Drop = () => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-neon-cyan selection:text-black">
            <Navbar />

            <main>
                <DropHero />
                <DropSpotlight />
                <DropVideo />
                <DropSocialProof />
                <DropReels />
                <DropStory />
            </main>

            <Footer />
        </div>
    );
};

export default Drop;
