import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface CartButtonProps {
  isScrolled?: boolean;
}

const CartButton = ({ isScrolled = false }: CartButtonProps) => {
  const { setIsOpen, totalItems } = useCart();

  return (
    <button
      onClick={() => setIsOpen(true)}
      className={cn(
        "relative p-2 rounded-lg transition-colors",
        isScrolled 
          ? "text-foreground hover:bg-muted" 
          : "text-white hover:bg-white/10"
      )}
    >
      <ShoppingCart className="w-5 h-5" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </button>
  );
};

export default CartButton;
