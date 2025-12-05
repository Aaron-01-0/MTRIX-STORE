import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductReview from "@/components/ProductReview";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    userId: string;
    orderId: string;
}

const ReviewModal = ({ isOpen, onClose, productId, productName, userId, orderId }: ReviewModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-mtrix-dark border-mtrix-gray text-white p-0 overflow-hidden">
                <ProductReview
                    orderId={orderId}
                    productId={productId}
                    productName={productName}
                    onReviewSubmitted={onClose}
                />
            </DialogContent>
        </Dialog>
    );
};

export default ReviewModal;
