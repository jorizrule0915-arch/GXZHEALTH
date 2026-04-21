import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Marcus T.',
    order: '5th order',
    message:
      "I've been coming back for a while now and every order has been smooth. Fast shipping, everything arrives exactly as expected. GXZ is the only place I trust for this.",
  },
  {
    name: 'Rachel D.',
    order: '3rd order',
    message:
      "Honestly wasn't sure at first but after my first order I was sold. Communication is great, packaging is solid, and the quality is consistent every time. Already placed my third.",
  },
  {
    name: 'James K.',
    order: '7th order',
    message:
      "Seven orders in and I have zero complaints. Reliable, discreet, and always on time. This is the kind of seller you stick with once you find them.",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-muted">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
            Customer Reviews
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-4 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Real feedback from repeat buyers who keep coming back.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-card flex flex-col gap-6"
            >
              <Quote className="w-8 h-8 text-secondary opacity-60" />
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                "{t.message}"
              </p>
              <div className="border-t border-border pt-4">
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-secondary text-xs mt-1">{t.order} with GXZ Health</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
