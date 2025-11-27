import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
    return (
        <div className="min-h-screen bg-background selection:bg-gold/30">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6">
                <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-8">Frequently Asked Questions</h1>
                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                            <AccordionContent>
                                We accept all major credit cards, debit cards, UPI, and net banking via our secure payment partner Razorpay.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>How long does shipping take?</AccordionTrigger>
                            <AccordionContent>
                                Standard shipping typically takes 5-7 business days. Express shipping options are available at checkout for faster delivery (2-3 business days).
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Can I track my order?</AccordionTrigger>
                            <AccordionContent>
                                Yes, once your order is shipped, you will receive a tracking number via email and SMS. You can also track your order from your "My Orders" page.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>What is your return policy?</AccordionTrigger>
                            <AccordionContent>
                                We offer a 30-day return policy for unused items in their original packaging. Please visit our Returns & Refunds page for more details.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FAQ;
