import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
    return (
        <div className="min-h-screen bg-background selection:bg-gold/30">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6">
                <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-8">Privacy Policy</h1>
                <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p>
                        Your privacy is important to us. It is MTRIX's policy to respect your privacy regarding any information we may collect from you across our website.
                    </p>
                    <h3>Information We Collect</h3>
                    <p>
                        We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
                    </p>
                    <h3>How We Use Your Information</h3>
                    <p>
                        We use the information we collect to operate and maintain our website, send you emails, and improve your experience.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;
