import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CartButton from '@/components/cart/CartButton';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Products' },
    { path: '/how-to-use', label: 'How to Use' },
    { path: '/about', label: 'About' },
    { path: '/returnandrefundpolicy', label: 'Return & Refund Policy' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const isHomePage = location.pathname === '/';
  const shouldShowBackground = isScrolled || !isHomePage;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        shouldShowBackground
          ? "bg-white/95 backdrop-blur-xl shadow-lg py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/GXZ-Health.png" 
              alt="GXZ Health Logo" 
              className="w-10 h-10 rounded-xl object-contain"
            />
            <span className={cn(
              "font-display text-xl font-bold tracking-tight transition-colors",
              shouldShowBackground ? "text-primary" : "text-white"
            )}>
              GXZ HEALTH
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-all duration-300 relative py-2",
                  shouldShowBackground
                    ? isActive(link.path)
                      ? "text-secondary"
                      : "text-foreground/70 hover:text-foreground"
                    : isActive(link.path)
                      ? "text-white"
                      : "text-white/70 hover:text-white",
                  "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-secondary after:transition-all after:duration-300",
                  isActive(link.path) ? "after:w-full" : "after:w-0 hover:after:w-full"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button & Cart */}
          <div className="hidden md:flex items-center gap-4">
            <CartButton isScrolled={shouldShowBackground} />
            <Button
              asChild
              variant={shouldShowBackground ? "default" : "hero"}
              size="default"
            >
              <Link to="/products">
                Shop Now
              </Link>
            </Button>
          </div>

          {/* Mobile: Cart & Menu */}
          <div className="md:hidden flex items-center gap-2">
            <CartButton isScrolled={shouldShowBackground} />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                shouldShowBackground ? "text-foreground" : "text-white"
              )}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t">
            <div className="py-4 px-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "block py-3 px-4 rounded-lg text-sm font-medium transition-colors",
                    isActive(link.path)
                      ? "bg-secondary/10 text-secondary"
                      : "text-foreground/70 hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4">
                <Button asChild variant="buy" className="w-full">
                  <Link to="/products" onClick={() => setIsMobileMenuOpen(false)}>
                    Shop Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
