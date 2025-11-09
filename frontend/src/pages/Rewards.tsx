import { motion } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Gift, TrendingUp } from 'lucide-react';
import { FACTORY_ADDRESS, FACTORY_ABI, BUILDBACK_ABI } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';

export default function Rewards() {
  const { address } = useAccount();
  const { toast } = useToast();

  const { data: hackathonAddresses } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getAllHackathons',
  });

  if (!address) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Connect your wallet to view and claim rewards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">My Rewards</h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            View and claim your earned rewards from backed projects
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-4xl">
          {hackathonAddresses && Array.isArray(hackathonAddresses) && hackathonAddresses.map((hackathonAddress, i) => (
            <RewardCard key={hackathonAddress} address={hackathonAddress} userAddress={address} index={i} />
          ))}

          {(!hackathonAddresses || !Array.isArray(hackathonAddresses) || hackathonAddresses.length === 0) && (
            <div className="text-center py-20">
              <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No rewards yet</h3>
              <p className="text-muted-foreground">Start backing projects to earn rewards!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RewardCard({ address, userAddress, index }: { address: `0x${string}`; userAddress: `0x${string}`; index: number }) {
  const { toast } = useToast();

  const { data: hackathonData } = useReadContract({
    address,
    abi: BUILDBACK_ABI,
    functionName: 'getHackathonDetails',
  });

  const { data: rewardData } = useReadContract({
    address,
    abi: BUILDBACK_ABI,
    functionName: 'calculateReward',
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
  });

  const { data: isSettled } = useReadContract({
    address,
    abi: BUILDBACK_ABI,
    functionName: 'eventSettled',
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleClaim = async () => {
    try {
      writeContract({
        address,
        abi: BUILDBACK_ABI,
        functionName: 'claimReward',
      } as any);

      toast({
        title: "Claim submitted!",
        description: "Your reward claim is being processed...",
      });
    } catch (error) {
      toast({
        title: "Claim failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  if (!hackathonData || !rewardData) return null;

  const hackathon = hackathonData as any;
  const [usdcReward, avaxReward] = rewardData as [bigint, bigint];
  const hasReward = Number(avaxReward) > 0 || Number(usdcReward) > 0;

  if (!hasReward) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="glass-card border-border">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl">{hackathon.name}</CardTitle>
              <CardDescription className="text-sm">Hackathon reward available</CardDescription>
            </div>
            {isSettled && (
              <div className="px-3 py-1 rounded-full bg-gradient-accent text-accent-foreground text-xs sm:text-sm font-medium self-start">
                Settled
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Your Reward
              </div>
              <div className="space-y-1">
                {Number(usdcReward) > 0 && (
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                    {(Number(usdcReward) / 1e6).toFixed(2)} USDC
                  </div>
                )}
                {Number(avaxReward) > 0 && (
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                    {formatEther(avaxReward)} AVAX
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={handleClaim}
              disabled={isConfirming || !isSettled}
              className="bg-gradient-accent hover:shadow-glow-accent w-full sm:w-auto text-sm sm:text-base"
              size="lg"
            >
              <Trophy className="w-4 h-4 mr-2" />
              {isConfirming ? 'Claiming...' : 'Claim Reward'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
