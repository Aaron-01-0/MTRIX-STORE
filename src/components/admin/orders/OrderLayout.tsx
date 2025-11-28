import React from 'react';
import { Outlet } from 'react-router-dom';

const OrderLayout = () => {
    return (
        <div className="min-h-screen bg-mtrix-black text-white print:bg-white print:text-black">
            <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-fade-in print:p-0 print:space-y-0 print:max-w-none">
                <div className="flex flex-col gap-1.5 border-b border-mtrix-gray pb-6 print:hidden">
                    <h1 className="text-3xl font-bold text-mtrix-gold tracking-tight font-orbitron">Order Management</h1>
                    <p className="text-gray-400 text-sm font-medium">Manage orders, track shipments, and handle customer requests</p>
                </div>
                <Outlet />
            </div>
        </div>
    );
};

export default OrderLayout;
