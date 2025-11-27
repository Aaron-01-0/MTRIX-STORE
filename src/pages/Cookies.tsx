import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Cookies = () => {
    return (
        <div className="min-h-screen bg-background selection:bg-gold/30">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6">
                <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-8">Cookie Policy</h1>
                <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p>
                        This Cookie Policy explains how MTRIX uses cookies and similar technologies to recognize you when you visit our website.
                    </p>
                    <h3>What are cookies?</h3>
                    <p>
                        Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                    </p>
                    <h3>How we use cookies</h3>
                    <p>
                        We use cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Cookies;
