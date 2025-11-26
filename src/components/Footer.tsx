import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Youtube, Mail, MapPin, Phone, ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/10 pt-20 pb-10 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="block group">
              <h2 className="text-3xl font-orbitron font-bold tracking-widest text-gradient-gold inline-block">
                MTRIX
              </h2>
            </Link>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              Born in chaos. Built with passion. Designed for the bold.
              We are the new standard in digital excellence.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Youtube, href: "#" },
                { icon: Facebook, href: "#" }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary hover:text-primary hover:bg-primary/10 transition-all duration-300 group"
                >
                  <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns (2 cols each) */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-orbitron font-bold text-white mb-6 flex items-center gap-2">
              Shop <span className="w-8 h-0.5 bg-primary/50 rounded-full" />
            </h3>
            <ul className="space-y-4">
              {[
                { label: "All Products", href: "/catalog" },
                { label: "New Arrivals", href: "/catalog?sort=new" },
                { label: "Limited Drops", href: "/drops" },
                { label: "Bundles", href: "/bundles" },
                { label: "Discounts", href: "/promotions" }
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-lg font-orbitron font-bold text-white mb-6 flex items-center gap-2">
              Support <span className="w-8 h-0.5 bg-primary/50 rounded-full" />
            </h3>
            <ul className="space-y-4">
              {[
                { label: "Track Order", href: "/track-order" },
                { label: "Shipping Policy", href: "/shipping" },
                { label: "Returns & Refunds", href: "/returns" },
                { label: "FAQs", href: "/faq" },
                { label: "Contact Us", href: "/support" }
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-lg font-orbitron font-bold text-white mb-6 flex items-center gap-2">
              Stay Updated <span className="w-8 h-0.5 bg-primary/50 rounded-full" />
            </h3>
            <p className="text-muted-foreground">
              Subscribe to our newsletter for exclusive drops, early access, and special offers.
            </p>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Enter your email"
                  className="bg-white/5 border-white/10 focus:border-primary/50 text-white pl-10 py-6"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Button
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 px-4 bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60">
                By subscribing, you agree to our Privacy Policy and consent to receive updates.
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MTRIX. All rights reserved.
          </p>

          <div className="flex items-center gap-8">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
