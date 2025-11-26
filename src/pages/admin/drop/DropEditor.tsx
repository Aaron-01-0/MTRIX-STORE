import DropManager from "@/components/admin/DropManager";

const DropEditor = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gradient-gold">Drop Editor</h2>
                <p className="text-muted-foreground">
                    Create and manage your limited edition drops.
                </p>
            </div>
            <DropManager />
        </div>
    );
};

export default DropEditor;
