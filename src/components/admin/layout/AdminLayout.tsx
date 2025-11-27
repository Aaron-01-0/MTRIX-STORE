import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AdminLayout = () => {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        const checkAdminRole = async () => {
            if (!user) {
                setIsAdmin(false);
                setCheckingRole(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .eq('role', 'admin')
                    .maybeSingle();

                if (error) throw error;
                setIsAdmin(!!data);
            } catch (error) {
                console.error('Error checking admin role:', error);
                setIsAdmin(false);
            } finally {
                setCheckingRole(false);
            }
        };

        if (!authLoading) {
            checkAdminRole();
        }
    }, [user, authLoading]);

    if (authLoading || checkingRole) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-primary animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/auth" replace />;
    }

    return (
        <div className="min-h-screen bg-black font-inter selection:bg-primary/30 selection:text-primary print:bg-white">
            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 print:hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <div className="print:hidden">
                <AdminSidebar />
                <AdminHeader />
            </div>

            <main className="pl-72 pt-20 min-h-screen relative z-10 print:pl-0 print:pt-0 print:min-h-0">
                <div className="p-8 animate-fade-in max-w-[1600px] mx-auto print:p-0 print:max-w-none">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
