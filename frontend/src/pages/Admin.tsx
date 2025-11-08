import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther, isAddress } from "viem";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FACTORY_ADDRESS, FACTORY_ABI, BUILDBACK_ABI } from "@/lib/contracts";
import { Trophy, Lock, Unlock, CheckCircle, XCircle, Plus, Settings, DollarSign } from "lucide-react";

// Component to fetch and display hackathon name
function HackathonOption({ address }: { address: string }) {
  const { data: hackathonData } = useReadContract({
    address: address as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'getHackathonDetails',
  });

  const details = hackathonData as any;
  const name = details?.name || "Loading...";

  return (
    <>
      {name} - {address.slice(0, 6)}...{address.slice(-4)}
    </>
  );
}

export default function Admin() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");

  // Check if user is factory owner
  const { data: factoryOwner } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'owner',
  });

  // Fetch all hackathons from factory
  const { data: hackathons, refetch: refetchHackathons } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getAllHackathons',
  });

  const hackathonList = (hackathons as string[]) || [];

  // Auto-select first hackathon if available
  useEffect(() => {
    if (hackathonList.length > 0 && !selectedHackathon) {
      setSelectedHackathon(hackathonList[0]);
    }
  }, [hackathonList.length]);

  const isFactoryOwner = address && factoryOwner && address.toLowerCase() === (factoryOwner as string).toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage hackathons, approve projects, and settle events
          </p>
        </div>

        {!address ? (
          <Card className="p-8 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground">Please connect your wallet to access the admin panel</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Hackathon Selector */}
            {hackathonList.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="hackathon-select" className="mb-2 block">Select Hackathon</Label>
                    <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
                      <SelectTrigger id="hackathon-select">
                        <SelectValue placeholder="Select a hackathon..." />
                      </SelectTrigger>
                      <SelectContent>
                        {hackathonList.map((addr: string) => (
                          <SelectItem key={addr} value={addr}>
                            <HackathonOption address={addr} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => refetchHackathons()}
                    className="mt-6"
                  >
                    Refresh
                  </Button>
                </div>
                {selectedHackathon && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {selectedHackathon}
                  </p>
                )}
              </Card>
            )}

            <Tabs defaultValue="hackathons" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="hackathons">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Hackathon
                </TabsTrigger>
                <TabsTrigger value="manage">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </TabsTrigger>
                <TabsTrigger value="settle">
                  <Trophy className="w-4 h-4 mr-2" />
                  Settle Event
                </TabsTrigger>
                <TabsTrigger value="fees">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Withdraw Fees
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hackathons">
                <CreateHackathonTab 
                  isFactoryOwner={isFactoryOwner} 
                  onHackathonCreated={() => refetchHackathons()}
                />
              </TabsContent>

              <TabsContent value="manage">
                <ManageHackathonTab hackathonAddress={selectedHackathon} />
              </TabsContent>

              <TabsContent value="settle">
                <SettleEventTab hackathonAddress={selectedHackathon} />
              </TabsContent>

              <TabsContent value="fees">
                <WithdrawFeesTab hackathonAddress={selectedHackathon} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}

function CreateHackathonTab({ isFactoryOwner, onHackathonCreated }: { isFactoryOwner: boolean; onHackathonCreated: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleCreateHackathon = async () => {
    if (!name || !description || !startTime || !endTime) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

    try {
      writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'createHackathon',
        args: [name, description, BigInt(startTimestamp), BigInt(endTimestamp)],
      } as any);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast({ title: "Success!", description: "Hackathon created successfully" });
      onHackathonCreated();
    }
  }, [isSuccess]);

  if (!isFactoryOwner) {
    return (
      <Card className="p-8 text-center">
        <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only the factory owner can create hackathons</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Hackathon</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Hackathon Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., ETHGlobal 2024"
            maxLength={100}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the hackathon..."
            maxLength={1000}
            rows={4}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <Button
          onClick={handleCreateHackathon}
          disabled={isPending || isConfirming}
          className="w-full"
        >
          {isPending || isConfirming ? "Creating..." : "Create Hackathon"}
        </Button>
      </div>
    </Card>
  );
}

function ManageHackathonTab({ hackathonAddress }: { hackathonAddress: string }) {
  const { toast } = useToast();
  const { address } = useAccount();

  const { data: projects } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'getAllProjects',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { data: owner } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'owner',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { data: registrationOpen } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'registrationOpen',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { data: backingAllowed } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'backingAllowed',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { writeContract, isPending } = useWriteContract();

  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase();

  const handleApproveProject = (projectId: bigint) => {
    writeContract({
      address: hackathonAddress as `0x${string}`,
      abi: BUILDBACK_ABI,
      functionName: 'approveProject',
      args: [projectId],
    } as any);
  };

  const handleCloseRegistration = () => {
    writeContract({
      address: hackathonAddress as `0x${string}`,
      abi: BUILDBACK_ABI,
      functionName: 'closeRegistration',
    } as any);
  };

  const handleToggleBacking = (enable: boolean) => {
    writeContract({
      address: hackathonAddress as `0x${string}`,
      abi: BUILDBACK_ABI,
      functionName: enable ? 'enableBacking' : 'disableBacking',
    } as any);
  };

  const handlePause = () => {
    writeContract({
      address: hackathonAddress as `0x${string}`,
      abi: BUILDBACK_ABI,
      functionName: 'pause',
    } as any);
  };

  const handleUnpause = () => {
    writeContract({
      address: hackathonAddress as `0x${string}`,
      abi: BUILDBACK_ABI,
      functionName: 'unpause',
    } as any);
  };

  return (
    <div className="space-y-6">
      {!isAddress(hackathonAddress) ? (
        <Card className="p-8 text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Hackathon Selected</h2>
          <p className="text-muted-foreground">Please select a hackathon from the dropdown above</p>
        </Card>
      ) : !isOwner ? (
            <Card className="p-8 text-center">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only the hackathon owner can manage this hackathon</p>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Hackathon Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={handleCloseRegistration}
                    disabled={!registrationOpen || isPending}
                    variant="outline"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Close Registration
                  </Button>
                  <Button
                    onClick={() => handleToggleBacking(true)}
                    disabled={backingAllowed as boolean || isPending}
                    variant="outline"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Enable Backing
                  </Button>
                  <Button
                    onClick={() => handleToggleBacking(false)}
                    disabled={!(backingAllowed as boolean) || isPending}
                    variant="outline"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Disable Backing
                  </Button>
                  <Button onClick={handlePause} disabled={isPending} variant="destructive">
                    Pause Contract
                  </Button>
                </div>
                <div className="mt-4 flex gap-4">
                  <Badge variant={registrationOpen ? "default" : "secondary"}>
                    Registration: {registrationOpen ? "Open" : "Closed"}
                  </Badge>
                  <Badge variant={backingAllowed ? "default" : "secondary"}>
                    Backing: {backingAllowed ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Projects</h3>
                {projects && Array.isArray(projects) && projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project: any) => (
                      <div
                        key={project.id.toString()}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{project.name}</h4>
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Creator: {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={project.approved ? "default" : "secondary"}>
                              {project.approved ? "Approved" : "Pending"}
                            </Badge>
                            {!project.approved && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveProject(project.id)}
                                disabled={isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span>USDC: {Number(project.totalUsdcBacking) / 1e6}</span>
                          <span>AVAX: {formatEther(project.totalAvaxBacking)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No projects found</p>
                )}
              </Card>
            </>
          )}
    </div>
  );
}

function SettleEventTab({ hackathonAddress }: { hackathonAddress: string }) {
  const { toast } = useToast();
  const { address } = useAccount();
  const [winners, setWinners] = useState([{ projectId: "", percentage: "" }]);

  const { data: owner } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'owner',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { data: eventSettled } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'eventSettled',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { writeContract, isPending } = useWriteContract();

  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase();

  const addWinner = () => {
    setWinners([...winners, { projectId: "", percentage: "" }]);
  };

  const updateWinner = (index: number, field: string, value: string) => {
    const newWinners = [...winners];
    newWinners[index] = { ...newWinners[index], [field]: value };
    setWinners(newWinners);
  };

  const removeWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index));
  };

  const handleSettleEvent = () => {
    const totalPercentage = winners.reduce((sum, w) => sum + Number(w.percentage || 0), 0);
    
    if (totalPercentage !== 100) {
      toast({ title: "Error", description: "Percentages must sum to 100%", variant: "destructive" });
      return;
    }

    const winnersData = winners.map(w => ({
      projectId: BigInt(w.projectId),
      percentage: BigInt(w.percentage)
    }));

    writeContract({
      address: hackathonAddress as `0x${string}`,
      abi: BUILDBACK_ABI,
      functionName: 'settleEvent',
      args: [winnersData],
    } as any);
  };

  return (
    <div className="space-y-6">
      {!isAddress(hackathonAddress) ? (
        <Card className="p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Hackathon Selected</h2>
          <p className="text-muted-foreground">Please select a hackathon from the dropdown above</p>
        </Card>
      ) : !isOwner ? (
            <Card className="p-8 text-center">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only the hackathon owner can settle events</p>
            </Card>
          ) : eventSettled ? (
            <Card className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Event Already Settled</h2>
              <p className="text-muted-foreground">This hackathon has already been settled</p>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Declare Winners</h3>
              <div className="space-y-4">
                {winners.map((winner, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label>Project ID</Label>
                      <Input
                        type="number"
                        value={winner.projectId}
                        onChange={(e) => updateWinner(index, 'projectId', e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Prize Percentage</Label>
                      <Input
                        type="number"
                        value={winner.percentage}
                        onChange={(e) => updateWinner(index, 'percentage', e.target.value)}
                        placeholder="50"
                      />
                    </div>
                    {winners.length > 1 && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeWinner(index)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button onClick={addWinner} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Winner
                </Button>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Total: {winners.reduce((sum, w) => sum + Number(w.percentage || 0), 0)}%
                  </p>
                  <Button
                    onClick={handleSettleEvent}
                    disabled={isPending}
                    className="w-full"
                  >
                    {isPending ? "Settling..." : "Settle Event"}
                  </Button>
                </div>
              </div>
            </Card>
          )}
    </div>
  );
}

function WithdrawFeesTab({ hackathonAddress }: { hackathonAddress: string }) {
  const { toast } = useToast();
  const { address } = useAccount();

  const { data: owner } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'owner',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { data: totalUsdcPool } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'totalUsdcPool',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { data: totalAvaxPool } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'totalAvaxPool',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { data: eventSettled } = useReadContract({
    address: hackathonAddress as `0x${string}`,
    abi: BUILDBACK_ABI,
    functionName: 'eventSettled',
    query: { enabled: isAddress(hackathonAddress) }
  });

  const { writeContract, isPending } = useWriteContract();

  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase();

  const usdcFees = totalUsdcPool ? (Number(totalUsdcPool) * 2) / 100 / 1e6 : 0;
  const avaxFees = totalAvaxPool ? (BigInt(totalAvaxPool.toString()) * 2n) / 100n : 0n;

  const handleWithdrawFees = () => {
    writeContract({
      address: hackathonAddress as `0x${string}`,
      abi: BUILDBACK_ABI,
      functionName: 'withdrawFees',
    } as any);
  };

  return (
    <div className="space-y-6">
      {!isAddress(hackathonAddress) ? (
        <Card className="p-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Hackathon Selected</h2>
          <p className="text-muted-foreground">Please select a hackathon from the dropdown above</p>
        </Card>
      ) : !isOwner ? (
            <Card className="p-8 text-center">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only the hackathon owner can withdraw fees</p>
            </Card>
          ) : !eventSettled ? (
            <Card className="p-8 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Event Not Settled</h2>
              <p className="text-muted-foreground">Fees can only be withdrawn after the event is settled</p>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6">Platform Fees (2%)</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg">
                  <span className="font-semibold">USDC Fees</span>
                  <span className="text-xl">{usdcFees.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg">
                  <span className="font-semibold">AVAX Fees</span>
                  <span className="text-xl">{formatEther(avaxFees)} AVAX</span>
                </div>
                <Button
                  onClick={handleWithdrawFees}
                  disabled={isPending}
                  className="w-full"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {isPending ? "Withdrawing..." : "Withdraw Fees"}
                </Button>
              </div>
            </Card>
          )}
    </div>
  );
}
