import { Mail, ExternalLink } from "lucide-react";

interface FooterProps {
  checkout?: boolean;
}

const checkoutPolicyLinks = [
  { label: "Terms", href: "https://gxzpeptides.com/terms-of-service/" },
  { label: "Privacy", href: "https://gxzpeptides.com/privacy-policy/" },
  { label: "Shipping", href: "https://gxzpeptides.com/shipping-delivery/" },
  { label: "Returns", href: "https://gxzpeptides.com/refunds-returns/" },
];

const Footer = ({ checkout = false }: FooterProps) => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/gxz-vitality-logo.png"
                alt="GXZ Vitality Logo"
                className="h-16 w-auto max-w-[220px] rounded-lg bg-white px-2 object-contain"
              />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              {checkout
                ? "GXZ Vitality products are intended for research purposes only. Not for human consumption."
                : "GXZ Vitality Premium Performance & Wellness Products. High-quality tools and formulations designed for precision, reliability, and daily performance."}
            </p>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-xs">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              <span className="text-white/80">
                {checkout
                  ? "For Research Purposes Only"
                  : "Premium Performance & Wellness Products"}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Home", href: "https://gxzpeptides.com/" },
                {
                  label: "Products",
                  href: "https://gxzpeptides.com/shop2/",
                },
                {
                  label: "How to Use",
                  href: "https://www.gxzhealthandwellness.com/how-to-use",
                },
                {
                  label: "About Us",
                  href: "https://gxzpeptides.com/what-is-peptides/",
                },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white text-sm transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 text-teal-400 mt-0.5" />
                <a
                  href="mailto:support@gxzpeptides.com"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  support@gxzpeptides.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <ExternalLink className="w-4 h-4 text-teal-400 mt-0.5" />
                <a
                  href="https://pep.gxzpeptides.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  pep.gxzpeptides.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-white/60 md:flex-row">
            <p>
              © {new Date().getFullYear()} GXZ Vitality. All rights reserved.
            </p>
            {checkout && (
              <nav
                aria-label="Checkout policies"
                className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
              >
                {checkoutPolicyLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
