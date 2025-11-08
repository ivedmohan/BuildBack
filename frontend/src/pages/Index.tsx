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
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block mb-4 px-4 py-2 rounded-full glass-card">
            <span className="text-sm font-medium bg-gradient-primary bg-clip-text text-transparent">
              Decentralized Prediction Markets for Hackathons
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Back the Next
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Big Thing
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Support hackathon projects you believe in with USDC or AVAX. Earn rewards when they win.
            Community-powered validation meets blockchain transparency.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow-primary transition-all text-lg px-8"
            >
              <Link to="/hackathons">Explore Hackathons</Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="border-primary/50 hover:bg-primary/10 text-lg px-8"
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto"
        >
          {[
            { icon: TrendingUp, label: 'Total Backed', value: '2,450 AVAX' },
            { icon: Users, label: 'Active Backers', value: '1,234' },
            { icon: Trophy, label: 'Projects Funded', value: '89' }
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl">
              <stat.icon className="w-8 h-8 text-primary mb-3 mx-auto" />
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg">Three simple steps to start backing winners</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
              className="glass-card p-8 rounded-2xl hover:shadow-glow-primary transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
