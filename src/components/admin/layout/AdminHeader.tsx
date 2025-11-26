import { Bell, Search, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

const AdminHeader = () => {
    const { user, signOut } = useAuth();

    return (
        <header className="h-20 fixed top-0 right-0 left-72 z-30 px-8 flex items-center justify-between bg-black/50 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
            {/* Search */}
            <div className="w-96 relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search anything..."
                        className="pl-11 h-11 bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-muted-foreground/50 rounded-xl transition-all duration-300"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 relative rounded-xl w-10 h-10 transition-all duration-300"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.8)]"></span>
                </Button>

                <div className="h-8 w-px bg-white/10" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-4 py-2 h-auto rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300 group">
                            <div className="w-9 h-9 rounded-full bg-gradient-gold p-[1px]">
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                            <div className="flex flex-col items-start hidden sm:flex">
                                <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">Admin</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Super User</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-black/95 backdrop-blur-2xl border-white/10 text-white p-2 rounded-xl shadow-2xl">
                        <DropdownMenuLabel className="text-muted-foreground text-xs uppercase tracking-wider px-2 py-2">My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="hover:bg-white/10 cursor-pointer rounded-lg px-3 py-2.5 focus:bg-white/10 focus:text-primary">
                            Profile Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-white/10 cursor-pointer rounded-lg px-3 py-2.5 focus:bg-white/10 focus:text-primary">
                            System Preferences
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            className="text-red-400 hover:bg-red-500/10 cursor-pointer focus:text-red-400 focus:bg-red-500/10 rounded-lg px-3 py-2.5"
                            onClick={() => signOut()}
                        >
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default AdminHeader;
