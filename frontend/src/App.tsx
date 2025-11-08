import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./components/WalletProvider";
import Index from "./pages/Index";
import Hackathons from "./pages/Hackathons";
import HackathonDetail from "./pages/HackathonDetail";
import Rewards from "./pages/Rewards";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const App = () => (
  <WalletProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/hackathons" element={<Hackathons />} />
          <Route path="/hackathon/:address" element={<HackathonDetail />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </WalletProvider>
);

export default App;
