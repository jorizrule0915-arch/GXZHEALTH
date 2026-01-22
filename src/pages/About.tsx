import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Target, Users, Shield, Award, Beaker, ArrowRight, BookOpen, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const About = () => {
  const values = [
    {
      icon: Target,
      title: 'Precision',
      description: 'Every product engineered for accurate, consistent results in research applications.'
    },
    {
      icon: Shield,
      title: 'Quality',
      description: 'Rigorous quality control ensures our products meet the highest standards.'
    },
    {
      icon: Users,
      title: 'Support',
      description: 'Comprehensive guides and responsive customer service for all users.'
    },
    {
      icon: Award,
      title: 'Trust',
      description: 'Trusted by researchers worldwide for reliable, research-grade supplies.'
    }
  ];

  const offerings = [
    {
      icon: Beaker,
      title: 'Reusable Injection Pens',
      description: 'Precision-engineered metal pens with adjustable dosing dials for accurate delivery.'
    },
    {
      icon: Beaker,
      title: 'Pen Cartridges',
      description: 'Standard 3mL capacity cartridges compatible with all GXZ pens.'
    },
    {
      icon: Beaker,
      title: 'Single-Use Needles',
      description: 'Ultra-fine sterile needles in various sizes for optimal precision.'
    },
    {
      icon: Beaker,
      title: 'Syringes & Accessories',
      description: 'Complete range of supporting supplies for your research needs.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary via-navy-800 to-navy-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-400 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto text-white"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm mb-8">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              About Our Company
            </span>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Research-Grade Supplies for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-500">
                Scientific Excellence
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              GXZ Health provides premium injection supplies designed specifically for research 
              and development applications. Our commitment to quality helps researchers achieve 
              accurate, reliable results.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Who We Are</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-4 mb-6">
                Your Trusted Partner in Research Supplies
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  GXZ Health was founded with a clear mission: to provide researchers with high-quality, 
                  reusable injection tools that deliver precision and reliability. We understand that 
                  accurate dosing is critical to research success.
                </p>
                <p>
                  Our product line includes precision-engineered metal injection pens, compatible cartridges, 
                  single-use needles, and essential accessories. Each product is designed to meet the 
                  demanding requirements of scientific research.
                </p>
                <p>
                  We also provide comprehensive usage guides to ensure researchers—especially those new 
                  to injection pen systems—can achieve optimal results from day one.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-8">
                <Button asChild variant="default" size="lg">
                  <Link to="/products">
                    View Products
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/how-to-use">
                    <BookOpen className="w-5 h-5" />
                    Usage Guide
                  </Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-2xl p-6 shadow-card border border-border hover:-translate-y-1 transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/10 to-teal-500/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-card-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">What We Offer</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-4 mb-6">
              Complete Research Supply Solutions
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From precision pens to sterile accessories, we provide everything you need for your research applications.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {offerings.map((offering, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-card border border-border text-center group hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-primary to-navy-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <offering.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold text-card-foreground mb-3">
                  {offering.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {offering.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible Use Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 md:p-12 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-amber-500" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Responsible Use Statement
                </h2>
              </div>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p className="text-lg">
                  Our injection pens and accessories are intended <strong className="text-foreground">solely for legitimate research purposes</strong>.
                </p>
                <p>
                  These products are <strong className="text-foreground">not FDA approved</strong> and are not intended for 
                  medical, clinical, or insulin use on humans or animals. They are precision tools 
                  designed for controlled research environments.
                </p>
                <p>
                  It is the researcher's responsibility to ensure all products are used in full 
                  compliance with applicable laws, institutional guidelines, and research protocols.
                </p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  By purchasing our products, you confirm that you understand and accept these terms of use.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-navy-800 to-navy-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Your Research?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Explore our product catalog or learn how to use our injection pens with our comprehensive guides.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="hero" size="lg">
                <Link to="/products">
                  Browse Products
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link to="/how-to-use">
                  <BookOpen className="w-5 h-5" />
                  How to Use
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
