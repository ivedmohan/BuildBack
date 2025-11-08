import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, User, Zap } from 'lucide-react';
import { BUILDBACK_ABI } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';

export default function HackathonDetail() {
  const { address } = useParams<{ address: `0x${string}` }>();
  const { address: userAddress } = useAccount();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [backAmount, setBackAmount] = useState('');

  const { data: hackathonData } = useReadContract({
    address: address as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'getHackathonDetails',
  });

  const { data: projects } = useReadContract({
    address: address as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'getAllProjects',
    query: {
      enabled: !!address,
    },
  });

  const { data: totalPool } = useReadContract({
    address: address as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'totalAvaxPool',
    query: {
      enabled: !!address,
    },
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleBackProject = async (projectId: number) => {
    if (!backAmount || Number(backAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid backing amount",
        variant: "destructive"
      });
      return;
    }

    try {
      writeContract({
        address: address as `0x${string}`,
        abi: BUILDBACK_ABI,
        functionName: 'backProjectWithAVAX',
        args: [BigInt(projectId)],
        value: parseEther(backAmount),
      } as any);

      toast({
        title: "Transaction submitted!",
        description: "Your backing is being processed...",
      });
    } catch (error) {
      toast({
        title: "Transaction failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  if (!hackathonData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const [name, description] = hackathonData as [string, string, bigint, bigint];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="glass-card p-8 rounded-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{name}</h1>
                <p className="text-lg text-muted-foreground">{description}</p>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">Active</Badge>
            </div>
            <div className="flex gap-8 mt-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Prize Pool</div>
                <div className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                  {totalPool ? formatEther(totalPool as bigint) : '0'} AVAX
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Projects</div>
                <div className="text-3xl font-bold">{projects && Array.isArray(projects) ? projects.length : 0}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects && Array.isArray(projects) && projects.map((project: any, i: number) => {
            const totalBacking = Number(project.totalAvaxBacking);
            const totalPoolNum = Number(totalPool || 0);
            const confidenceScore = totalPoolNum > 0 ? (totalBacking / totalPoolNum) * 100 : 0;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-card border-border hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                      {project.approved && (
                        <Badge variant="default" className="ml-2">Approved</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Confidence Score
                        </span>
                        <span className="font-bold text-accent">{confidenceScore.toFixed(1)}%</span>
                      </div>
                      <Progress value={confidenceScore} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Backing</span>
                      <span className="font-semibold">{formatEther(project.totalAvaxBacking)} AVAX</span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="w-4 h-4 mr-2" />
                      {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                    </div>

                    {selectedProject === Number(project.id) ? (
                      <div className="space-y-3 pt-2">
                        <Input
                          type="number"
                          placeholder="Amount (AVAX)"
                          value={backAmount}
                          onChange={(e) => setBackAmount(e.target.value)}
                          step="0.01"
                          min="0.01"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleBackProject(Number(project.id))}
                            disabled={isConfirming || !userAddress}
                            className="flex-1 bg-gradient-primary hover:shadow-glow-primary"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            {isConfirming ? 'Confirming...' : 'Confirm Back'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedProject(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setSelectedProject(Number(project.id))}
                        disabled={!project.approved || !userAddress}
                        className="w-full"
                        variant="outline"
                      >
                        Back This Project
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {(!projects || !Array.isArray(projects) || projects.length === 0) && (
            <div className="col-span-full text-center py-20">
              <p className="text-muted-foreground">No projects registered yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
