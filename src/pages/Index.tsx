import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Truck, Award, Beaker, Syringe, CircleDot, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import heroBg from '@/assets/hero-bg.jpg';
import productPen from '@/assets/products/reusable-pen.png';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const Index = () => {
  const products = [
    {
      id: 1,
      name: 'Reusable Peptide Pens',
      description: 'Precision-engineered metal injection pens for accurate dosing',
      price: '$20.00',
      icon: Syringe,
      category: 'pen'
    },
    {
      id: 2,
      name: 'Pen Cartridges',
      description: 'Standard 3mL capacity cartridges compatible with all pens',
      price: '$10.00',
      icon: Beaker,
      category: 'cartridge'
    },
    {
      id: 3,
      name: 'Single-Use Needles',
      description: 'Sterile micro-tip needles (32g x 4mm) - 100 per box',
      price: '$8.00',
      icon: CircleDot,
      category: 'needle'
    },
    {
      id: 4,
      name: 'Syringes',
      description: 'Available in Small, Mini, and Large sizes - 100 per box',
      price: '$15.00',
      icon: Package,
      category: 'accessory'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Research Grade',
      description: 'Premium quality tools designed for precision research applications'
    },
    {
      icon: Truck,
      title: 'Fast Shipping',
      description: 'Quick, discreet delivery to your laboratory or research facility'
    },
    {
      icon: Award,
      title: 'Quality Assured',
      description: 'Rigorous quality control ensures consistent, reliable performance'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/90 via-navy-800/80 to-transparent" />
        
        <div className="container mx-auto px-6 relative z-10 py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero Content */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-white"
            >
              {/* Research Badge */}
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm mb-8"
              >
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                <span>Research-Grade Supplies</span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
              >
                Precision Tools for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-500">
                  Research
                </span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-xl"
              >
                Premium reusable injection pens, cartridges, and accessories for scientific research and development. Trusted by researchers worldwide.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 mb-12">
                <Button asChild variant="hero" size="lg">
                  <Link to="/products">
                    Shop Products
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="heroOutline" size="lg">
                  <Link to="/how-to-use">
                    How to Use Guide
                  </Link>
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-wrap gap-8 text-sm text-white/70"
              >
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <feature.icon className="w-4 h-4 text-teal-400" />
                    <span>{feature.title}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full" />
                
                {/* Product image */}
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <img 
                    src={productPen} 
                    alt="Reusable Injection Pen" 
                    className="w-full h-auto rounded-2xl"
                  />
                  
                  {/* Floating badge */}
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-xl shadow-glow">
                    <span className="font-semibold">Starting at $20</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Products Section */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Our Catalog</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
              Research Supplies
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Quality tools for precision research. All products designed for accuracy and reliability.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <product.icon className="w-7 h-7 text-secondary" />
                </div>
                
                {/* Category badge */}
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  {product.category}
                </span>
                
                {/* Title */}
                <h3 className="font-display text-xl font-semibold text-card-foreground mt-2 mb-3">
                  {product.name}
                </h3>
                
                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>
                
                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {product.price}
                  </span>
                  <Button asChild variant="buy" size="sm">
                    <Link to="/products">View</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button asChild variant="default" size="lg">
              <Link to="/products">
                View All Products
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-navy-700 flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary via-navy-800 to-navy-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Explore our complete range of research-grade injection supplies and accessories.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="hero" size="lg">
                <Link to="/products">
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link to="/how-to-use">
                  Learn How to Use
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-6 bg-navy-900">
        <div className="container mx-auto px-6">
          <p className="text-center text-white/50 text-sm">
            <strong className="text-white/70">Disclaimer:</strong> Products are intended for research purposes only. 
            Not FDA approved. Not intended for medical, clinical, or insulin use on humans or animals.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
