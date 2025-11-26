import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TopNav = () => {
    return (
        <header className="h-16 bg-mtrix-charcoal/80 backdrop-blur-md border-b border-white/10 fixed top-0 right-0 left-64 z-40 flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
                <h2 className="text-white font-orbitron font-bold tracking-wide">DROP DASHBOARD</h2>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-mono text-xs">
                    PRODUCTION
                </Badge>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search drops, orders..."
                        className="bg-black/20 border-white/10 pl-10 text-white placeholder:text-gray-600 focus:border-neon-cyan focus:ring-neon-cyan h-9"
                    />
                </div>

                <button className="relative text-gray-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-electric-magenta rounded-full animate-pulse" />
                </button>
            </div>
        </header>
    );
};

export default TopNav;
