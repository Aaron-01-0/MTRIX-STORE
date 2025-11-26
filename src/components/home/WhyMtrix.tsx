import { Zap, Users, Crown, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const pillars = [
    {
        icon: Zap,
        title: "Designs That Hit Different",
        description: "No generic stock art. Only bold, original visuals."
    },
    {
        icon: Users,
        title: "Created by Real Creators",
        description: "We actually use this stuff every single day."
    },
    {
        icon: Crown,
        title: "Premium Feel, Always",
        description: "Quality that you can feel from the first touch."
    },
    {
        icon: ShieldCheck,
        title: "Thoughtful Materials",
        description: "Built to last through your longest sessions."
    }
];

const WhyMtrix = () => {
    return (
        <section className="py-20 bg-mtrix-dark">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4">
                        Why <span className="text-primary">MTRIX</span>?
                    </h2>
                    <p className="text-muted-foreground">Because normal is boring.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pillars.map((pillar, index) => (
                        <Card key={index} className="bg-mtrix-black border-mtrix-gray hover:border-primary/50 transition-colors duration-300 group">
                            <CardContent className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 mx-auto bg-mtrix-dark rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                                    <pillar.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-orbitron font-bold text-white">
                                    {pillar.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {pillar.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyMtrix;
