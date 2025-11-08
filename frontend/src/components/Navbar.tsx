import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-card sticky top-0 z-50 border-b"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-gradient-primary group-hover:shadow-glow-primary transition-shadow">
            <Rocket className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            BuildBack
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link 
            to="/hackathons" 
            className="text-foreground/80 hover:text-foreground transition-colors font-medium"
          >
            Hackathons
          </Link>
          <Link 
            to="/rewards" 
            className="text-foreground/80 hover:text-foreground transition-colors font-medium"
          >
            My Rewards
          </Link>
          <Link 
            to="/admin" 
            className="text-foreground/80 hover:text-foreground transition-colors font-medium"
          >
            Admin
          </Link>
          <ConnectButton />
        </div>
      </div>
    </motion.nav>
  );
}
