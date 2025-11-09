import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link } from 'react-router-dom';
import { Rocket, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-card sticky top-0 z-50 border-b"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-gradient-primary group-hover:shadow-glow-primary transition-shadow">
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BuildBack
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-4 pt-4 pb-2">
                <Link 
                  to="/hackathons" 
                  className="text-foreground/80 hover:text-foreground transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Hackathons
                </Link>
                <Link 
                  to="/rewards" 
                  className="text-foreground/80 hover:text-foreground transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Rewards
                </Link>
                <Link 
                  to="/admin" 
                  className="text-foreground/80 hover:text-foreground transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
                <div className="py-2">
                  <ConnectButton />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
