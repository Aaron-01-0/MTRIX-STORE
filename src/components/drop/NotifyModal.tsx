import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface NotifyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotifyModal = ({ isOpen, onClose }: NotifyModalProps) => {
    const [email, setEmail] = useState("");
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate API call
        setTimeout(() => {
            toast({
                title: "You're on the list!",
                description: "We'll notify you as soon as the drop goes live.",
            });
            onClose();
            setEmail("");
        }, 500);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-mtrix-black border-mtrix-gray text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-orbitron font-bold text-center text-gradient-gold">
                        GET EARLY ACCESS
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-400">
                        Be the first to know when Drop 01 goes live. Limited quantities available.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-mtrix-dark border-mtrix-gray text-white placeholder:text-gray-500 focus:border-neon-cyan focus:ring-neon-cyan"
                    />
                    <Button
                        type="submit"
                        className="w-full bg-neon-cyan text-black font-bold hover:bg-neon-cyan/80 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all duration-300"
                    >
                        NOTIFY ME
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NotifyModal;
