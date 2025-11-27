import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Settings,
    Image as ImageIcon,
    Tag,
    Users,
    HelpCircle,
    Star,
    Palette,
    Zap,
    Instagram,
    AlertTriangle,
    CreditCard,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: Package, label: 'Bundles', path: '/admin/bundles' },
    { icon: AlertTriangle, label: 'Inventory', path: '/admin/inventory' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
    { icon: ImageIcon, label: 'Content', path: '/admin/content' },
    { icon: Tag, label: 'Coupons', path: '/admin/coupons' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: HelpCircle, label: 'Support', path: '/admin/support' },
    { icon: Star, label: 'Reviews', path: '/admin/reviews' },
    { icon: Palette, label: 'Brand Kit', path: '/admin/brand-kit' },
    { icon: ImageIcon, label: 'Media Library', path: '/admin/media' },
    { icon: Zap, label: 'Campaigns', path: '/admin/campaigns' },
    { icon: Instagram, label: 'Social', path: '/admin/social' },
    { icon: Users, label: 'Community', path: '/admin/community' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const AdminSidebar = () => {
    const location = useLocation();
    const { signOut } = useAuth();

    return (
        <aside className="w-72 bg-black border-r border-white/5 min-h-screen flex flex-col fixed left-0 top-0 z-40 shadow-2xl">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-8 border-b border-white/5">
                <Link to="/" className="group">
                    <span className="text-2xl font-orbitron font-bold text-gradient-gold tracking-widest group-hover:opacity-80 transition-opacity">
                        MTRIX <span className="text-primary text-xs align-top ml-1">ADMIN</span>
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                            )}

                            <Icon className={cn(
                                "w-5 h-5 transition-all duration-300",
                                isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-white group-hover:scale-110"
                            )} />

                            <span className="font-medium tracking-wide">{item.label}</span>

                            {isActive && (
                                <ChevronRight className="w-4 h-4 ml-auto text-primary animate-pulse" />
                            )}
                        </Link>
                    );
                })}

                <div className="pt-6 mt-6 border-t border-white/5">
                    <div className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Special Modules
                    </div>
                    <Link
                        to="/admin/drops"
                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-neon-magenta hover:bg-neon-magenta/10 transition-all duration-300 group"
                    >
                        <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Drop Admin</span>
                    </Link>
                </div>
            </nav>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-black/50 backdrop-blur-sm">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
