import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Returns = () => {
    return (
        <div className="min-h-screen bg-background selection:bg-gold/30">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6">
                <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-8">Cancellations & Refunds</h1>
                <div className="prose prose-invert max-w-none text-muted-foreground">
                    <h3>Return Policy</h3>
                    <p>
                        Our policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately we can’t offer you a refund or exchange.
                    </p>
                    <h3>Eligibility</h3>
                    <p>
                        To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
                    </p>
                    <h3>Refunds</h3>
                    <p>
                        Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Returns;
