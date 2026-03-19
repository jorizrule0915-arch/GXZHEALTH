import { Link } from 'react-router-dom';
import { Beaker, Mail, MapPin, Phone, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="/GXZ-Health.png" 
                alt="GXZ Health Logo" 
                className="w-10 h-10 rounded-xl object-contain"
              />
              <span className="font-display text-xl font-bold">GXZ HEALTH</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              GXZ Health Premium Performance & Wellness Products
              High-quality tools and formulations designed for precision, reliability, and daily performance.
            </p>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-xs">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              <span className="text-white/80">For Research Use Only</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', path: '/' },
                { label: 'Products', path: '/products' },
                { label: 'How to Use', path: '/how-to-use' },
                { label: 'About Us', path: '/about' },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/70 hover:text-white text-sm transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-6">Products</h4>
            <ul className="space-y-3">
              {[
                'Reusable Injection Pens',
                'Pen Cartridges',
                'Single-Use Needles',
                'Syringes',
              ].map((product) => (
                <li key={product}>
                  <Link
                    to="/products"
                    className="text-white/70 hover:text-white text-sm transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {product}
                  </Link>
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
                <a href="mailto:support@gxzpeptides.com" className="text-white/70 hover:text-white transition-colors">
                  support@gxzhealth.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <ExternalLink className="w-4 h-4 text-teal-400 mt-0.5" />
                <a 
                  href="https://health.gxzhealth.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Health.gxzhealth.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
            <p>© {new Date().getFullYear()} GXZ Health. All rights reserved.</p>
            <p className="text-center md:text-right text-xs">
              Products are not FDA approved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
