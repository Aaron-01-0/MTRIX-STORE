import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
    return (
        <div className="min-h-screen bg-background selection:bg-gold/30">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6">
                <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-8">Terms and Conditions</h1>
                <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p>Welcome to MTRIX.</p>
                    <p>
                        These terms and conditions outline the rules and regulations for the use of MTRIX's Website.
                    </p>
                    <h3>1. Terms</h3>
                    <p>
                        By accessing this website we assume you accept these terms and conditions. Do not continue to use MTRIX if you do not agree to take all of the terms and conditions stated on this page.
                    </p>
                    <h3>2. License</h3>
                    <p>
                        Unless otherwise stated, MTRIX and/or its licensors own the intellectual property rights for all material on MTRIX. All intellectual property rights are reserved.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;
