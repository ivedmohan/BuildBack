import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Trophy, Zap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block mb-4 px-3 sm:px-4 py-2 rounded-full glass-card">
            <span className="text-xs sm:text-sm font-medium bg-gradient-primary bg-clip-text text-transparent">
              Decentralized Prediction Markets for Hackathons
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-2">
            Back the Next
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Big Thing
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Support hackathon projects you believe in with USDC or AVAX. Earn rewards when they win.
            Community-powered validation meets blockchain transparency.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button 
              asChild 
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow-primary transition-all text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
            >
              <Link to="/hackathons">Explore Hackathons</Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="border-primary/50 hover:bg-primary/10 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
            >
              <Link to="/rewards">View Rewards</Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 md:mt-20 max-w-4xl mx-auto"
        >
          {[
            { icon: TrendingUp, label: 'Total Backed', value: '2,450 AVAX' },
            { icon: Users, label: 'Active Backers', value: '1,234' },
            { icon: Trophy, label: 'Projects Funded', value: '89' }
          ].map((stat, i) => (
            <div key={i} className="glass-card p-4 sm:p-6 rounded-2xl">
              <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 sm:mb-3 mx-auto" />
              <div className="text-2xl sm:text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">How It Works</h2>
          <p className="text-muted-foreground text-base sm:text-lg px-4">Three simple steps to start backing winners</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: Users,
              title: 'Connect Wallet',
              description: 'Link your wallet to start participating in prediction markets on Avalanche'
            },
            {
              icon: Zap,
              title: 'Back Projects',
              description: 'Browse hackathon projects and back the ones you believe will win with USDC or AVAX'
            },
            {
              icon: Trophy,
              title: 'Earn Rewards',
              description: 'Claim proportional rewards from the prize pool if your backed project wins'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-6 sm:p-8 rounded-2xl hover:shadow-glow-primary transition-all"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-primary flex items-center justify-center mb-3 sm:mb-4">
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
