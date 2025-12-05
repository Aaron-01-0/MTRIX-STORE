import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";

interface NotifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName?: string;
}

const NotifyModal = ({ isOpen, onClose, productName = "this item" }: NotifyModalProps) => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        // TODO: Connect to 'product_notifications' table in Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: "Notification Enabled",
            description: `We'll notify you at ${email} when ${productName} is back in stock.`,
        });

        setIsLoading(false);
        onClose();
        setEmail("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-mtrix-black border-mtrix-gray text-white sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                        <Bell className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-orbitron font-bold text-center text-white">
                        Get Notified
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-400">
                        Enter your email to receive an update when <span className="text-primary font-medium">{productName}</span> is back in stock.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-mtrix-dark border-mtrix-gray text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-black font-bold hover:bg-primary/80 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all duration-300"
                    >
                        {isLoading ? "Submitting..." : "Notify Me"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NotifyModal;
