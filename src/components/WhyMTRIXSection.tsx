import { Shield, Palette, Truck, Award, Recycle, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const WhyMTRIXSection = () => {
  const features = [
    {
      icon: Shield,
      title: "Designed for the Bold",
      description: "Every product at MTRIX is made for those who think different, act fearless, and live with style. We don't follow trends — we create them."
    },
    {
      icon: Palette,
      title: "Gen-Z Aesthetic. Premium Quality.",
      description: "From prints to finishes, every detail screams vibe + value. You get trend-driven designs with quality that lasts."
    },
    {
      icon: Award,
      title: "Built for Setups That Speak You.",
      description: "Whether it's your desk, wall, or laptop — MTRIX helps you turn every setup into an extension of your personality."
    },
    {
      icon: Recycle,
      title: "Sustainable & Thoughtfully Crafted.",
      description: "We care about how things are made. Every piece is designed responsibly — because good design should never come at the planet's cost."
    },
    {
      icon: Users,
      title: "Made by Creators, for Creators.",
      description: "MTRIX is powered by people who live the same culture — gaming, art, design, and late-night creativity. We get your vibe."
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-dark">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-orbitron font-bold text-gradient-gold mb-6">
            Why Choose MTRIX?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're not just another brand. We're a movement that combines style, protection, 
            and sustainability to create products that define your digital lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-mtrix-dark border-mtrix-gray hover:border-primary transition-all duration-500 group hover:shadow-gold"
              >
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-gold rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-mtrix-black" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-8 bg-mtrix-dark/50 px-8 py-4 rounded-xl border border-mtrix-gray">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div className="w-px h-12 bg-mtrix-gray"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">200+</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div className="w-px h-12 bg-mtrix-gray"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4.8</div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyMTRIXSection;