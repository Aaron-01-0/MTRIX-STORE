import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Zap,
    ShoppingCart,
    Users,
    Image as ImageIcon,
    BarChart3,
    Settings
} from "lucide-react";

const Sidebar = () => {
    const location = useLocation();

    const links = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/drops/dashboard" },
        { icon: Zap, label: "Drops", path: "/admin/drops/editor" },
        { icon: ShoppingCart, label: "Orders", path: "/admin/drops/orders" },
        { icon: Users, label: "Waitlist", path: "/admin/drops/waitlist" },
        { icon: ImageIcon, label: "UGC", path: "/admin/drops/ugc" },
        { icon: BarChart3, label: "Analytics", path: "/admin/drops/analytics" },
        { icon: Settings, label: "Settings", path: "/admin/drops/settings" },
    ];

    return (
        <aside className="w-64 bg-mtrix-charcoal border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col z-50">
            <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-orbitron font-bold text-white tracking-wider">
                    MTRIX <span className="text-neon-cyan">ADMIN</span>
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <link.icon className={`w-5 h-5 ${isActive ? "text-neon-cyan" : "group-hover:text-neon-cyan transition-colors"}`} />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-electric-magenta/20 flex items-center justify-center text-electric-magenta font-bold">
                        A
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Admin User</p>
                        <p className="text-xs text-gray-500">Super Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
