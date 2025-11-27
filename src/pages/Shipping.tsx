import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Shipping = () => {
    return (
        <div className="min-h-screen bg-background selection:bg-gold/30">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6">
                <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-8">Shipping Policy</h1>
                <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p>
                        At MTRIX, we strive to deliver your premium gear as quickly and safely as possible.
                    </p>
                    <h3>Processing Time</h3>
                    <p>
                        Orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.
                    </p>
                    <h3>Shipping Rates & Delivery Estimates</h3>
                    <p>
                        Shipping charges for your order will be calculated and displayed at checkout.
                    </p>
                    <ul>
                        <li>Standard Shipping: 5-7 business days</li>
                        <li>Express Shipping: 2-3 business days</li>
                    </ul>
                    <p>
                        *Delivery delays can occasionally occur.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Shipping;
