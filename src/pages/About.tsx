import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Target, Users, Shield, Award, Beaker, ArrowRight, BookOpen, Truck, Zap, Heart } from 'lucide-react';
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
      description: 'Every product crafted for consistent, reliable results that support your wellness goals.'
    },
    {
      icon: Shield,
      title: 'Quality',
      description: 'Rigorous quality control ensures our products meet the highest standards of performance.'
    },
    {
      icon: Users,
      title: 'Support',
      description: 'Comprehensive guides and responsive customer service for every customer.'
    },
    {
      icon: Award,
      title: 'Trust',
      description: 'Trusted by wellness enthusiasts worldwide for premium, reliable products.'
    }
  ];

  const offerings = [
    {
      icon: Zap,
      title: 'Performance Supplements',
      description: 'Science-backed formulations designed to boost strength, endurance, and hydration.'
    },
    {
      icon: Heart,
      title: 'Body Care Products',
      description: 'Premium body care essentials crafted to nourish, restore, and support daily wellness.'
    },
    {
      icon: Beaker,
      title: 'Wellness Accessories',
      description: 'High-quality tools and accessories built for precision and everyday performance.'
    },
    {
      icon: Truck,
      title: 'Fast & Discreet Shipping',
      description: 'Quick delivery straight to your door, so you never miss a step in your routine.'
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
              Premium Products for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-500">
                Everyday Wellness
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              GXZ Health provides premium wellness supplements and body care products designed 
              to support precision, consistency, and everyday performance. Our commitment to 
              quality helps you feel and perform at your best.
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
                Your Trusted Partner in Health & Wellness
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  GXZ Health was founded with a clear mission: to provide individuals with high-quality 
                  wellness products that deliver real results. We believe that feeling strong, recovered, 
                  and energized every day shouldn't be complicated.
                </p>
                <p>
                  Our product line includes performance supplements, nourishing body care essentials, 
                  and precision wellness accessories. Each product is formulated and crafted to meet 
                  the demands of an active, health-conscious lifestyle.
                </p>
                <p>
                  We also provide comprehensive usage guides to ensure every customer — whether new 
                  to wellness products or experienced — gets the most out of every GXZ Health product 
                  from day one.
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
              Complete Performance & Wellness Solutions
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From performance supplements to body care essentials, we provide everything you need 
              to support your strength, recovery, and daily wellness.
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
              Ready to Elevate Your Wellness?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Explore our product catalog or learn how to get the most out of every GXZ Health product with our comprehensive guides.
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