import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqData } from "@/data/faqData";

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

                <div className="mt-16 pt-16 border-t border-white/10">
                    <h2 className="text-3xl font-orbitron font-bold text-gradient-gold mb-8">Frequently Asked Questions</h2>
                    <div className="max-w-3xl space-y-8">
                        {faqData.map((section, idx) => (
                            <div key={idx} className="space-y-4">
                                <h3 className="text-xl font-orbitron font-semibold text-primary/80 border-b border-white/10 pb-2">
                                    {section.category}
                                </h3>
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
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;
