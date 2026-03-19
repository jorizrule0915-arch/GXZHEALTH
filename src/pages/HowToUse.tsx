import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, AlertTriangle, Syringe, Droplet, Shield, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const HowToUse = () => {
  const [selectedStep, setSelectedStep] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // YouTube video mapping with descriptions
  const videoInstructions = [
    { 
      title: "How to use your pen", 
      videoId: "7UOZ6iLO3JQ",
      description: "A step-by-step guide on how to properly operate your refillable injection pen, from setup to correct usage."
    },
    { 
      title: "What to expect when you receive your pen", 
      videoId: "g5kVjiQakKs",
      description: "An overview of what comes in the package, how your pen is delivered, and important things to check before first use."
    },
    { 
      title: "How to reconstitute your compound", 
      videoId: "djPEGo9uurk",
      description: "This video explains the proper method for reconstituting your compound, including handling and mixing guidelines."
    },
    { 
      title: "How to reconstitute your peptide", 
      videoId: "SK1F6bqY0Qg",
      description: "Learn the correct way to safely mix your peptide to ensure proper preparation and accurate dosing."
    },
    { 
      title: "How to attach the needle to your pen", 
      videoId: "bwZc9CwRLLg",
      description: "A simple tutorial on how to securely attach the needle to your pen for safe and proper use."
    }
  ];

  const tutorialSteps = [
    { step: 1, title: "Gather Supplies", instruction: "Gather pen, cartridge, needles, alcohol swabs, Compound, and syringe.", category: "prep" },
    { step: 2, title: "Prepare Area", instruction: "Wash hands and clean work surface.", category: "prep" },
    { step: 3, title: "Attach Needle", instruction: "Twist reconstitution needle onto syringe until secure.", category: "prep" },
    { step: 4, title: "Prepare Vial", instruction: "Remove cap and clean rubber top with alcohol swab.", category: "prep" },
    { step: 5, title: "Fill Syringe", instruction: "Pull syringe plunger back to 3 mL.", category: "fill" },
    { step: 6, title: "Inject Air", instruction: "Insert needle into vial and push 3 mL air inside.", category: "fill" },
    { step: 7, title: "Draw Compound", instruction: "Turn vial upside down and draw 3 mL Compound into syringe.", category: "fill" },
    { step: 8, title: "Secure Syringe", instruction: "Recap syringe and place on clean surface.", category: "fill" },
    { step: 9, title: "Open Pen", instruction: "Remove pen cap and unscrew chamber from body.", category: "assembly" },
    { step: 10, title: "Insert Cartridge", instruction: "Remove cartridge from packaging and place in chamber.", category: "assembly" },
    { step: 11, title: "Reassemble", instruction: "Push plunger in, attach chamber back to pen firmly.", category: "assembly" },
    { step: 12, title: "Clean Stopper", instruction: "Clean rubber stopper on cartridge with alcohol swab.", category: "assembly" },
    { step: 13, title: "Insert Vent", instruction: "Insert venting needle slightly into stopper (off to side).", category: "fill" },
    { step: 14, title: "Fill Cartridge", instruction: "Insert syringe needle next to vent and inject liquid slowly.", category: "fill" },
    { step: 15, title: "Remove Needles", instruction: "Remove syringe and venting needle, recap both safely.", category: "fill" },
    { step: 16, title: "Attach Pen Needle", instruction: "Twist pen needle onto chamber, remove outer and inner caps.", category: "assembly" },
    { step: 17, title: "Prime Pen", instruction: "Hold upright, dial and push until bubbles escape and liquid appears.", category: "use" },
    { step: 18, title: "Storage", instruction: "If not using immediately, recap needle and store in cool, dry place.", category: "use" },
    { step: 19, title: "Set Dose", instruction: "Dial the number of units you want to inject.", category: "use" },
    { step: 20, title: "Prepare Site", instruction: "Clean injection area with alcohol swab.", category: "use" },
    { step: 21, title: "Inject", instruction: "Hold pen at 90° angle, press down and push button to zero.", category: "use" },
    { step: 22, title: "Complete", instruction: "Wait few seconds, remove pen, recap needle, unscrew and store safely.", category: "use" }
  ];

  const categories = {
    prep: { label: 'Preparation', color: 'bg-blue-500' },
    fill: { label: 'Filling', color: 'bg-teal-500' },
    assembly: { label: 'Assembly', color: 'bg-amber-500' },
    use: { label: 'Usage', color: 'bg-green-500' }
  };

  const safetyTips = [
    { icon: Syringe, text: 'Always use single-use needles' },
    { icon: Droplet, text: 'Keep area sterile' },
    { icon: Shield, text: 'Follow proper technique' },
    { icon: Thermometer, text: 'Store at proper temperature' }
  ];

  const currentStep = tutorialSteps.find(step => step.step === selectedStep)!;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && selectedStep > 1) {
        setSelectedStep(selectedStep - 1);
      }
      if (e.key === 'ArrowRight' && selectedStep < 22) {
        setSelectedStep(selectedStep + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedStep]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && selectedStep < 22) {
      setSelectedStep(selectedStep + 1);
    }
    if (distance < -50 && selectedStep > 1) {
      setSelectedStep(selectedStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-muted via-background to-muted">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Step-by-Step Guide</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
              How to Use Your Refillable Pen
            </h1>
            <p className="text-muted-foreground text-lg">
              Follow this interactive 22-step guide to safely prepare and use your injection pen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Tutorial */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-[300px_1fr] gap-8 max-w-6xl mx-auto">
            {/* Steps Sidebar */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border h-fit lg:sticky lg:top-24">
              <h3 className="font-display text-lg font-semibold text-card-foreground mb-4 px-2">
                All Steps
              </h3>
              <div className="max-h-[500px] overflow-y-auto space-y-1 pr-2">
                {tutorialSteps.map((step) => (
                  <button
                    key={step.step}
                    onClick={() => setSelectedStep(step.step)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      selectedStep === step.step
                        ? 'bg-gradient-to-r from-secondary to-teal-500 text-white shadow-md'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                      selectedStep === step.step 
                        ? 'bg-white/20' 
                        : step.step < selectedStep 
                          ? 'bg-secondary/10 text-secondary' 
                          : 'bg-muted'
                    }`}>
                      {step.step < selectedStep ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step.step
                      )}
                    </span>
                    <span className="text-sm font-medium truncate">{step.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div 
              className="lg:min-h-[500px]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card rounded-3xl shadow-card border border-border overflow-hidden"
                >
                  {/* Step image */}
                  <div className="h-64 md:h-80 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={`/Step images/Step ${selectedStep}.${[1, 4, 5, 6, 17].includes(selectedStep) ? 'jpeg' : 'jpg'}`}
                      alt={`Step ${selectedStep}: ${currentStep.title}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center text-center hidden">
                      <div>
                        <div className="w-24 h-24 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4">
                          <span className="font-display text-4xl font-bold text-secondary">{selectedStep}</span>
                        </div>
                        <p className="text-muted-foreground text-sm">Step illustration</p>
                      </div>
                    </div>
                    
                    {/* Category badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white ${categories[currentStep.category as keyof typeof categories].color}`}>
                        {categories[currentStep.category as keyof typeof categories].label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Step details */}
                  <div className="p-8">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                      <span>Step {selectedStep} of 22</span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                      <span>{categories[currentStep.category as keyof typeof categories].label}</span>
                    </div>
                    
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-card-foreground mb-4">
                      {currentStep.title}
                    </h2>
                    
                    <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                      {currentStep.instruction}
                    </p>
                    
                    {/* Progress bar */}
                    <div className="mb-8">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{Math.round((selectedStep / 22) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-secondary to-teal-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(selectedStep / 22) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                    
                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedStep(Math.max(1, selectedStep - 1))}
                        disabled={selectedStep === 1}
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                      </Button>
                      
                      <span className="text-sm text-muted-foreground hidden md:block">
                        Use arrow keys or swipe to navigate
                      </span>
                      
                      <Button
                        variant="buy"
                        onClick={() => setSelectedStep(Math.min(22, selectedStep + 1))}
                        disabled={selectedStep === 22}
                      >
                        Next
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Video Instructions - WITH DESCRIPTIONS */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Video Instructions
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Watch these detailed video guides for step-by-step visual instructions.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto space-y-16">
            {videoInstructions.map((video, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={video.videoId}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`grid md:grid-cols-2 gap-8 items-center ${
                    isEven ? '' : 'md:grid-flow-col-dense'
                  }`}
                >
                  <div className={`${isEven ? 'md:order-1' : 'md:order-2'}`}>
                    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg border border-border pt-[56.25%]">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}?rel=0`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full rounded-2xl"
                      ></iframe>
                    </div>
                  </div>
                  
                  <div className={`${isEven ? 'md:order-2' : 'md:order-1'} space-y-4`}>
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground capitalize">
                      {video.title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">Safety Essentials</h3>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              {safetyTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl p-6 text-center shadow-card border border-border"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                    <tip.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <p className="text-sm font-medium text-card-foreground">{tip.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground mb-6">Shop our full range of performance and wellness products.</p>
          <Button asChild variant="default" size="lg">
            <Link to="/products">
              View Our Products
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowToUse;
