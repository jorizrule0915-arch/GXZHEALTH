import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, ShieldCheck, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const storefrontUrl = "https://gxzhealthandwellness.com";
  const isCheckoutFlow = ["/checkout", "/payment"].includes(
    location.pathname,
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: `${storefrontUrl}/`, label: "Home" },
    { href: `${storefrontUrl}/products`, label: "Products" },
    { href: `${storefrontUrl}/how-to-use`, label: "How to Use" },
    { href: `${storefrontUrl}/about`, label: "About" },
    {
      href: `${storefrontUrl}/returnandrefundpolicy`,
      label: "Return & Refund Policy",
    },
  ];

  const isHomePage = location.pathname === "/";
  const shouldShowBackground = isScrolled || !isHomePage;

  if (isCheckoutFlow) {
    return (
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-white/95 py-3 shadow-sm backdrop-blur-xl dark:bg-background/95">
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6">
          <a
            href={storefrontUrl}
            aria-label="Return to GXZ Health and Wellness"
            className="flex items-center"
          >
            <img
              src="/gxz-peptides-logo.png"
              alt="GXZ Peptides Logo"
              className="h-11 w-auto max-w-[160px] rounded-lg bg-white px-2 object-contain sm:h-12 sm:max-w-[180px]"
            />
          </a>

          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
            <ShieldCheck className="h-4 w-4 text-secondary sm:h-5 sm:w-5" />
            <span>Secure checkout</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        shouldShowBackground
          ? "bg-white/95 backdrop-blur-xl shadow-lg py-3"
          : "bg-transparent py-5",
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href={storefrontUrl} className="flex items-center gap-3 group">
            <img
              src="/gxz-peptides-logo.png"
              alt="GXZ Peptides Logo"
              className="h-12 w-auto max-w-[180px] rounded-lg bg-white px-2 object-contain"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-all duration-300 relative py-2",
                  shouldShowBackground
                    ? "text-foreground/70 hover:text-foreground"
                    : "text-white/70 hover:text-white",
                  "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-secondary after:transition-all after:duration-300",
                  "after:w-0 hover:after:w-full",
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Button & Cart */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href={`${storefrontUrl}/products`}
              aria-label="Shop products on GXZ Health and Wellness"
              className={cn(
                "rounded-lg p-2 transition-colors",
                shouldShowBackground
                  ? "text-foreground/70 hover:bg-muted hover:text-foreground"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <ShoppingCart className="h-5 w-5" />
            </a>
            <Button
              asChild
              variant={shouldShowBackground ? "default" : "hero"}
              size="default"
            >
              <a href={`${storefrontUrl}/products`}>Shop Now</a>
            </Button>
          </div>

          {/* Mobile: Cart & Menu */}
          <div className="md:hidden flex items-center gap-2">
            <a
              href={`${storefrontUrl}/products`}
              aria-label="Shop products on GXZ Health and Wellness"
              className={cn(
                "rounded-lg p-2 transition-colors",
                shouldShowBackground ? "text-foreground" : "text-white",
              )}
            >
              <ShoppingCart className="h-5 w-5" />
            </a>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                shouldShowBackground ? "text-foreground" : "text-white",
              )}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t">
            <div className="py-4 px-6 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4">
                <Button asChild variant="buy" className="w-full">
                  <a
                    href={`${storefrontUrl}/products`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Shop Now
                  </a>
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
