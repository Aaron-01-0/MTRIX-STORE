import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { faqData } from "@/data/faqData";

const FAQ = () => {
    return (
        <div className="min-h-screen bg-background selection:bg-gold/30">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6">
                <h1 className="text-4xl font-orbitron font-bold text-gradient-gold mb-8 text-center">Frequently Asked Questions</h1>
                <div className="max-w-3xl mx-auto space-y-8">
                    {faqData.map((section, idx) => (
                        <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                            <h2 className="text-xl font-orbitron font-semibold text-primary/80 border-b border-white/10 pb-2">
                                {section.category}
                            </h2>
                            <Accordion type="single" collapsible className="w-full">
                                {section.questions.map((item, qIdx) => (
                                    <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`} className="border-white/10">
                                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                                            {item.q}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground whitespace-pre-line">
                                            {item.a}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FAQ;
