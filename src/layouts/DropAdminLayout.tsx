import { Outlet } from "react-router-dom";
import Sidebar from "@/components/admin/drop/Sidebar";
import TopNav from "@/components/admin/drop/TopNav";

const DropAdminLayout = () => {
    return (
        <div className="min-h-screen bg-mtrix-charcoal text-white font-inter selection:bg-neon-cyan selection:text-black">
            <Sidebar />
            <TopNav />
            <main className="pl-64 pt-16 min-h-screen">
                <div className="p-8 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DropAdminLayout;
