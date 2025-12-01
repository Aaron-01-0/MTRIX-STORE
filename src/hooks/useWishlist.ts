import { useWishlistContext } from '@/context/WishlistContext';

export type { WishlistItem } from '@/context/WishlistContext';

export const useWishlist = () => {
  return useWishlistContext();
};
