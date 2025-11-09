import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, User, Zap, Plus, Lock, Info } from 'lucide-react';
import { BUILDBACK_ABI } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';

export default function HackathonDetail() {
  const { address } = useParams<{ address: `0x${string}` }>();
  const { address: userAddress } = useAccount();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [backAmount, setBackAmount] = useState('');
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

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

  const { data: registrationOpen } = useReadContract({
    address: address as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'registrationOpen',
    query: {
      enabled: !!address,
    },
  });

  const { data: backingAllowed } = useReadContract({
    address: address as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'backingAllowed',
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

  const handleRegisterProject = async () => {
    if (!projectName || !projectDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (projectName.length > 50 || projectDescription.length > 500) {
      toast({
        title: "Text too long",
        description: "Name max 50 chars, description max 500 chars",
        variant: "destructive"
      });
      return;
    }

    try {
      writeContract({
        address: address as `0x${string}`,
        abi: BUILDBACK_ABI,
        functionName: 'registerProject',
        args: [projectName, projectDescription],
      } as any);

      toast({
        title: "Project registered!",
        description: "Waiting for admin approval...",
      });
      
      setRegisterDialogOpen(false);
      setProjectName('');
      setProjectDescription('');
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

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

  const hackathon = hackathonData as any;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12"
        >
          <div className="glass-card p-4 sm:p-6 md:p-8 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{hackathon.name}</h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground">{hackathon.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={registrationOpen ? "default" : "secondary"}>
                  Registration: {registrationOpen ? "Open" : "Closed"}
                </Badge>
                <Badge variant={backingAllowed ? "default" : "secondary"}>
                  Backing: {backingAllowed ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-6">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Prize Pool</div>
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                  {totalPool ? formatEther(totalPool as bigint) : '0'} AVAX
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Projects</div>
                <div className="text-2xl sm:text-3xl font-bold">{projects && Array.isArray(projects) ? projects.length : 0}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Register Project Button */}
        {registrationOpen && userAddress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:shadow-glow-primary w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Register Your Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Register Your Project</DialogTitle>
                  <DialogDescription>
                    Submit your project to this hackathon. It will need admin approval before users can back it.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="My Awesome Project"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">{projectName.length}/50 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">Description</Label>
                    <Textarea
                      id="projectDescription"
                      placeholder="Describe your project..."
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      maxLength={500}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">{projectDescription.length}/500 characters</p>
                  </div>
                  <Button 
                    onClick={handleRegisterProject} 
                    disabled={isConfirming || !projectName || !projectDescription}
                    className="w-full"
                  >
                    {isConfirming ? 'Registering...' : 'Register Project'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}

        {/* Backing Status Alert */}
        {!backingAllowed && (
          <Alert className="mb-8 border-yellow-500/50 bg-yellow-500/10">
            <Lock className="w-4 h-4" />
            <AlertDescription>
              <strong>Backing is currently disabled.</strong> The admin needs to enable backing before you can back projects.
            </AlertDescription>
          </Alert>
        )}

        {/* Developer Share Info */}
        {backingAllowed && (
          <Alert className="mb-8 border-blue-500/50 bg-blue-500/10">
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>Support Builders Directly!</strong> 10% of your contribution goes directly to the project creator, 88% to the prize pool for supporters of winners, 2% platform fee.
            </AlertDescription>
          </Alert>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg sm:text-xl mb-2">{project.name}</CardTitle>
                        <CardDescription className="text-sm">{project.description}</CardDescription>
                      </div>
                      {project.approved && (
                        <Badge variant="default" className="self-start">Approved</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
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
                          className="text-sm sm:text-base"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            onClick={() => handleBackProject(Number(project.id))}
                            disabled={isConfirming || !userAddress}
                            className="flex-1 bg-gradient-primary hover:shadow-glow-primary text-sm sm:text-base"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            {isConfirming ? 'Confirming...' : 'Confirm Support'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedProject(null)}
                            className="text-sm sm:text-base"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setSelectedProject(Number(project.id))}
                        disabled={!project.approved || !userAddress || !backingAllowed}
                        className="w-full text-sm sm:text-base"
                        variant="outline"
                      >
                        {!backingAllowed ? 'Support Disabled' : 'Support This Project'}
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
