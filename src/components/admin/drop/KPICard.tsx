import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
    title: string;
    value: string;
    change?: string;
    trend?: "up" | "down" | "neutral";
    icon?: React.ElementType;
    color?: "cyan" | "magenta" | "default";
}

const KPICard = ({ title, value, change, trend = "neutral", icon: Icon, color = "default" }: KPICardProps) => {
    const getTrendColor = () => {
        switch (trend) {
            case "up": return "text-neon-cyan";
            case "down": return "text-electric-magenta";
            default: return "text-gray-400";
        }
    };

    const getTrendIcon = () => {
        switch (trend) {
            case "up": return <ArrowUpRight className="w-4 h-4" />;
            case "down": return <ArrowDownRight className="w-4 h-4" />;
            default: return <Minus className="w-4 h-4" />;
        }
    };

    const getBorderColor = () => {
        switch (color) {
            case "cyan": return "border-neon-cyan/30 hover:border-neon-cyan/60";
            case "magenta": return "border-electric-magenta/30 hover:border-electric-magenta/60";
            default: return "border-white/10 hover:border-white/20";
        }
    };

    return (
        <Card className={`bg-mtrix-charcoal/50 backdrop-blur-sm border ${getBorderColor()} transition-all duration-300`}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
                    {Icon && <Icon className={`w-5 h-5 ${color === "cyan" ? "text-neon-cyan" : color === "magenta" ? "text-electric-magenta" : "text-gray-400"}`} />}
                </div>

                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-orbitron font-bold text-white">{value}</h3>
                    {change && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span>{change}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default KPICard;
