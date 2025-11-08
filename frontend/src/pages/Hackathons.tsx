import { motion } from 'framer-motion';
import { useReadContract } from 'wagmi';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { FACTORY_ADDRESS, FACTORY_ABI, BUILDBACK_ABI } from '@/lib/contracts';

export default function Hackathons() {
  const { data: hackathonAddresses } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getAllHackathons',
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">Active Hackathons</h1>
          <p className="text-xl text-muted-foreground">
            Browse ongoing hackathons and back your favorite projects
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathonAddresses && Array.isArray(hackathonAddresses) && hackathonAddresses.map((address, i) => (
            <HackathonCard key={address} address={address} index={i} />
          ))}
          
          {(!hackathonAddresses || !Array.isArray(hackathonAddresses) || hackathonAddresses.length === 0) && (
            <div className="col-span-full text-center py-20">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No hackathons yet</h3>
              <p className="text-muted-foreground">Check back soon for upcoming events!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HackathonCard({ address, index }: { address: `0x${string}`; index: number }) {
  const { data: hackathonData } = useReadContract({
    address,
    abi: BUILDBACK_ABI,
    functionName: 'getHackathonDetails',
  });

  const { data: projectCount } = useReadContract({
    address,
    abi: BUILDBACK_ABI,
    functionName: 'projectCount',
  });

  const { data: totalUsdcPool } = useReadContract({
    address,
    abi: BUILDBACK_ABI,
    functionName: 'totalUsdcPool',
  });

  const { data: totalAvaxPool } = useReadContract({
    address,
    abi: BUILDBACK_ABI,
    functionName: 'totalAvaxPool',
  });

  if (!hackathonData) return null;

  const hackathon = hackathonData as any;
  const isActive = Date.now() / 1000 < Number(hackathon.endTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/hackathon/${address}`}>
        <Card className="glass-card border-border hover:shadow-glow-primary transition-all cursor-pointer h-full">
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <Badge variant={isActive ? "default" : "secondary"} className="mb-2">
                {isActive ? 'Active' : 'Ended'}
              </Badge>
            </div>
            <CardTitle className="text-xl line-clamp-1">{hackathon.name}</CardTitle>
            <CardDescription className="line-clamp-2">{hackathon.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Ends {new Date(Number(hackathon.endTime) * 1000).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm">
                <Trophy className="w-4 h-4 mr-2 text-primary" />
                <span className="font-semibold text-primary">
                  {totalUsdcPool ? `${Number(totalUsdcPool) / 1e6} USDC` : '0 USDC'}
                  {' + '}
                  {totalAvaxPool ? `${(Number(totalAvaxPool) / 1e18).toFixed(2)} AVAX` : '0 AVAX'}
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-2" />
                {projectCount ? Number(projectCount) : 0} Projects
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
