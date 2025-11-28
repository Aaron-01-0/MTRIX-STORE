import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageCircle,
  Mail,
  Phone,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface SupportSettings {
  support_email: string;
  support_phone: string;
  support_address?: string;
}

import { faqData } from '@/data/faqData';

const Support = () => {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  // const [faqs, setFaqs] = useState<FAQ[]>([]); // Removed DB state
  const [settings, setSettings] = useState<SupportSettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('support_settings').select('*').single();
      if (!error) setSettings(data);
    } catch (error) {
      console.error('Error fetching support data:', error);
    }
  };


  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-16 px-6 bg-gradient-dark">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl font-orbitron font-bold text-gradient-gold mb-4">
              MTRIX Support
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're here to help! Find answers to your questions or get in touch with our support team
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12 px-6">
          <div className="container mx-auto">
            <h2 className="text-3xl font-orbitron font-bold text-gradient-gold mb-8 text-center">
              Get In Touch
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-mtrix-dark border-mtrix-gray hover:border-primary transition-all duration-300 text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Email Support</h3>
                  <p className="text-muted-foreground mb-3">
                    {settings?.support_email || 'support@mtrix.com'}
                  </p>
                  <Button
                    onClick={() => window.location.href = `mailto:${settings?.support_email || 'support@mtrix.com'}`}
                    className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300"
                  >
                    Send Email
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-mtrix-dark border-mtrix-gray hover:border-primary transition-all duration-300 text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Phone Support</h3>
                  <p className="text-muted-foreground mb-3">
                    {settings?.support_phone || '+91 XXXXXXXXXX'}
                  </p>
                  <Button
                    onClick={() => window.location.href = `tel:${settings?.support_phone}`}
                    className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300"
                  >
                    Call Now
                  </Button>
                </CardContent>
              </Card>
              {settings?.support_address && (
                <Card className="bg-mtrix-dark border-mtrix-gray hover:border-primary transition-all duration-300 text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Visit Us</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-line">
                      {settings.support_address}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>


        {/* FAQ Section */}
        <section className="py-12 px-6">
          <div className="container mx-auto">
            <h2 className="text-3xl font-orbitron font-bold text-gradient-gold mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="max-w-3xl mx-auto space-y-8">
              {faqData.map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <h3 className="text-xl font-orbitron font-semibold text-primary/80 border-b border-white/10 pb-2">
                    {section.category}
                  </h3>
                  <div className="space-y-4">
                    {section.questions.map((faq, qIdx) => {
                      const id = `faq-${idx}-${qIdx}`;
                      return (
                        <Card
                          key={id}
                          className="bg-mtrix-dark border-mtrix-gray hover:border-primary transition-all duration-300"
                        >
                          <CardContent className="p-0">
                            <button
                              onClick={() => toggleFaq(id)}
                              className="w-full p-6 text-left flex items-center justify-between hover:bg-mtrix-gray/20 transition-colors"
                            >
                              <span className="text-foreground font-semibold">
                                {faq.q}
                              </span>
                              {expandedFaq === id ? (
                                <ChevronUp className="w-5 h-5 text-primary" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>

                            {expandedFaq === id && (
                              <div className="px-6 pb-6">
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                  {faq.a}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-12 px-6 bg-mtrix-dark/30">
          <div className="container mx-auto">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-orbitron font-bold text-gradient-gold mb-8 text-center">
                Send Us a Message
              </h2>

              <Card className="bg-mtrix-dark border-mtrix-gray">
                <CardContent className="p-8">
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Support;