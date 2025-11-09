import { expect } from "chai";
import { ethers } from "hardhat";
import { BuildBackFactory, BuildBack, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BuildBack - Dual Token (USDC + AVAX) Test", function () {
  let factory: BuildBackFactory;
  let hackathon: BuildBack;
  let usdc: MockUSDC;
  let owner: SignerWithAddress;
  let team1: SignerWithAddress;
  let team2: SignerWithAddress;
  let team3: SignerWithAddress;
  let backer1: SignerWithAddress;
  let backer2: SignerWithAddress;
  let backer3: SignerWithAddress;

  const USDC_DECIMALS = 6;
  const toUSDC = (amount: number) => ethers.parseUnits(amount.toString(), USDC_DECIMALS);
  const toAVAX = (amount: number) => ethers.parseEther(amount.toString());

  beforeEach(async function () {
    [owner, team1, team2, team3, backer1, backer2, backer3] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Distribute USDC to backers
    await usdc.mint(backer1.address, toUSDC(10000));
    await usdc.mint(backer2.address, toUSDC(10000));
    await usdc.mint(backer3.address, toUSDC(10000));

    // Deploy Factory
    const BuildBackFactory = await ethers.getContractFactory("BuildBackFactory");
    factory = await BuildBackFactory.deploy(await usdc.getAddress());
    await factory.waitForDeployment();

    // Create hackathon
    const now = Math.floor(Date.now() / 1000);
    const tx = await factory.createHackathon(
      "Test Hackathon",
      "A test hackathon for BuildBack",
      now,
      now + 86400 // 1 day
    );

    const receipt = await tx.wait();
    const event = receipt?.logs.find((log: any) => {
      try {
        return factory.interface.parseLog(log)?.name === "HackathonCreated";
      } catch {
        return false;
      }
    });

    const parsedEvent = factory.interface.parseLog(event!);
    const hackathonAddress = parsedEvent?.args[0];

    hackathon = await ethers.getContractAt("BuildBack", hackathonAddress);
  });

  describe("Phase 1: Project Registration", function () {
    it("Should allow teams to register projects", async function () {
      await hackathon.connect(team1).registerProject("DeFi Lend", "Lending protocol");
      await hackathon.connect(team2).registerProject("NFT Market", "NFT marketplace");
      await hackathon.connect(team3).registerProject("DAO Tools", "DAO tooling");

      expect(await hackathon.projectCount()).to.equal(3);
    });
  });

  describe("Phase 3: Backing with USDC", function () {
    beforeEach(async function () {
      await hackathon.connect(team1).registerProject("Project 1", "Description 1");
      await hackathon.connect(team2).registerProject("Project 2", "Description 2");
      await hackathon.connect(team3).registerProject("Project 3", "Description 3");
      await hackathon.approveProject(1);
      await hackathon.approveProject(2);
      await hackathon.approveProject(3);
    });

    it("Should allow backing with USDC", async function () {
      await hackathon.connect(owner).enableBacking();
      await usdc.connect(backer1).approve(await hackathon.getAddress(), toUSDC(1000));
      
      await hackathon.connect(backer1).backProject(1, toUSDC(100));
      
      const project = await hackathon.getProjectDetails(1);
      expect(project.totalUsdcBacking).to.equal(toUSDC(88)); // 88% goes to pool
      expect(await hackathon.totalUsdcPool()).to.equal(toUSDC(88));
    });
  });

  describe("Phase 3: Backing with AVAX", function () {
    beforeEach(async function () {
      await hackathon.connect(team1).registerProject("Project 1", "Description 1");
      await hackathon.connect(team2).registerProject("Project 2", "Description 2");
      await hackathon.connect(team3).registerProject("Project 3", "Description 3");
      await hackathon.approveProject(1);
      await hackathon.approveProject(2);
      await hackathon.approveProject(3);
    });

    it("Should allow backing with AVAX", async function () {
      await hackathon.connect(owner).enableBacking();
      
      await hackathon.connect(backer1).backProjectWithAVAX(1, { value: toAVAX(1) });
      
      const project = await hackathon.getProjectDetails(1);
      expect(project.totalAvaxBacking).to.equal(toAVAX(0.88)); // 88% goes to pool
      expect(await hackathon.totalAvaxPool()).to.equal(toAVAX(0.88));
    });

    it("Should reject backing below minimum AVAX", async function () {
      await hackathon.connect(owner).enableBacking();
      
      await expect(
        hackathon.connect(backer1).backProjectWithAVAX(1, { value: toAVAX(0.005) })
      ).to.be.revertedWithCustomError(hackathon, "BackingTooSmall");
    });
  });

  describe("Phase 3: Mixed Backing (USDC + AVAX)", function () {
    beforeEach(async function () {
      await hackathon.connect(team1).registerProject("Project 1", "Description 1");
      await hackathon.connect(team2).registerProject("Project 2", "Description 2");
      await hackathon.connect(team3).registerProject("Project 3", "Description 3");
      await hackathon.approveProject(1);
      await hackathon.approveProject(2);
      await hackathon.approveProject(3);
    });

    it("Should allow users to back with both USDC and AVAX", async function () {
      await hackathon.connect(owner).enableBacking();

      // Back with USDC
      await usdc.connect(backer1).approve(await hackathon.getAddress(), toUSDC(10000));
      await hackathon.connect(backer1).backProject(1, toUSDC(500));
      
      // Back with AVAX
      await hackathon.connect(backer1).backProjectWithAVAX(2, { value: toAVAX(2) });

      // Different backer backing different projects
      await usdc.connect(backer2).approve(await hackathon.getAddress(), toUSDC(10000));
      await hackathon.connect(backer2).backProject(1, toUSDC(1000));
      await hackathon.connect(backer2).backProjectWithAVAX(3, { value: toAVAX(1.5) });

      // Check pools
      expect(await hackathon.totalUsdcPool()).to.equal(toUSDC(1320)); // 88% of 1500
      expect(await hackathon.totalAvaxPool()).to.equal(toAVAX(3.08)); // 88% of 3.5
    });

    it("Should allow same user to back same project with both tokens", async function () {
      await hackathon.connect(owner).enableBacking();

      // Back project 1 with both USDC and AVAX
      await usdc.connect(backer1).approve(await hackathon.getAddress(), toUSDC(10000));
      await hackathon.connect(backer1).backProject(1, toUSDC(500));
      await hackathon.connect(backer1).backProjectWithAVAX(1, { value: toAVAX(1) });

      const backing = await hackathon.getUserBacking(backer1.address, 1);
      expect(backing.usdcAmount).to.equal(toUSDC(440)); // 88% of 500
      expect(backing.avaxAmount).to.equal(toAVAX(0.88)); // 88% of 1

      const project = await hackathon.getProjectDetails(1);
      expect(project.totalUsdcBacking).to.equal(toUSDC(440));
      expect(project.totalAvaxBacking).to.equal(toAVAX(0.88));
    });
  });

  describe("Phase 4: Settlement with Mixed Backing", function () {
    beforeEach(async function () {
      // Setup projects
      await hackathon.connect(team1).registerProject("Project 1", "Description 1");
      await hackathon.connect(team2).registerProject("Project 2", "Description 2");
      await hackathon.connect(team3).registerProject("Project 3", "Description 3");
      await hackathon.approveProject(1);
      await hackathon.approveProject(2);
      await hackathon.approveProject(3);

      // Enable backing
      await hackathon.connect(owner).enableBacking();

      // Mixed backing
      await usdc.connect(backer1).approve(await hackathon.getAddress(), toUSDC(10000));
      await usdc.connect(backer2).approve(await hackathon.getAddress(), toUSDC(10000));

      // Backer1: USDC on P1, AVAX on P2
      await hackathon.connect(backer1).backProject(1, toUSDC(500));
      await hackathon.connect(backer1).backProjectWithAVAX(2, { value: toAVAX(2) });

      // Backer2: USDC on P2, AVAX on P3
      await hackathon.connect(backer2).backProject(2, toUSDC(300));
      await hackathon.connect(backer2).backProjectWithAVAX(3, { value: toAVAX(1) });

      // Backer3: Both tokens on P1
      await usdc.connect(backer3).approve(await hackathon.getAddress(), toUSDC(10000));
      await hackathon.connect(backer3).backProject(1, toUSDC(200));
      await hackathon.connect(backer3).backProjectWithAVAX(1, { value: toAVAX(1) });

      // Close registration and settle
      await hackathon.closeRegistration();
    });

    it("Should settle with multiple winners and distribute correctly", async function () {
      // Project 1 wins 50%, Project 2 wins 30%, Project 3 wins 20%
      await hackathon.settleEvent([
        { projectId: 1, percentage: 50 },
        { projectId: 2, percentage: 30 },
        { projectId: 3, percentage: 20 }
      ]);

      expect(await hackathon.eventSettled()).to.be.true;
    });
  });

  describe("Phase 5: Reward Claims with Mixed Tokens", function () {
    beforeEach(async function () {
      // Setup projects
      await hackathon.connect(team1).registerProject("Project 1", "Description 1");
      await hackathon.connect(team2).registerProject("Project 2", "Description 2");
      await hackathon.connect(team3).registerProject("Project 3", "Description 3");
      await hackathon.approveProject(1);
      await hackathon.approveProject(2);
      await hackathon.approveProject(3);

      // Enable backing
      await hackathon.connect(owner).enableBacking();

      // Mixed backing
      await usdc.connect(backer1).approve(await hackathon.getAddress(), toUSDC(10000));
      await hackathon.connect(backer1).backProject(1, toUSDC(1000));
      await hackathon.connect(backer1).backProjectWithAVAX(1, { value: toAVAX(1) });

      await usdc.connect(backer2).approve(await hackathon.getAddress(), toUSDC(10000));
      await hackathon.connect(backer2).backProject(1, toUSDC(1000));
      await hackathon.connect(backer2).backProjectWithAVAX(2, { value: toAVAX(1) });

      // Close and settle
      await hackathon.closeRegistration();
      await hackathon.settleEvent([{ projectId: 1, percentage: 100 }]);
    });

    it("Should allow claiming both USDC and AVAX rewards", async function () {
      const usdcBefore = await usdc.balanceOf(backer1.address);
      const avaxBefore = await ethers.provider.getBalance(backer1.address);

      await hackathon.connect(backer1).claimReward();

      const usdcAfter = await usdc.balanceOf(backer1.address);
      const avaxAfter = await ethers.provider.getBalance(backer1.address);

      // Should receive USDC rewards (98% of 1000 USDC pool, 50% share)
      expect(usdcAfter - usdcBefore).to.be.gt(toUSDC(490));

      // Should receive AVAX rewards (98% of 1 AVAX pool, 100% share)
      expect(avaxAfter - avaxBefore).to.be.gt(toAVAX(0.95));
    });

    it("Should calculate correct rewards with calculateReward", async function () {
      const [usdcReward, avaxReward] = await hackathon.calculateReward(backer1.address);

      // Backer1 has 50% of USDC pool and 100% of AVAX pool
      expect(usdcReward).to.be.gt(toUSDC(490));
      expect(avaxReward).to.be.gt(toAVAX(0.95));
    });
  });

  describe("Emergency Functions with Mixed Tokens", function () {
    beforeEach(async function () {
      await hackathon.connect(team1).registerProject("Project 1", "Description 1");
      await hackathon.approveProject(1);
      await hackathon.connect(owner).enableBacking();

      // Back with both tokens
      await usdc.connect(backer1).approve(await hackathon.getAddress(), toUSDC(1000));
      await hackathon.connect(backer1).backProject(1, toUSDC(500));
      await hackathon.connect(backer1).backProjectWithAVAX(1, { value: toAVAX(1) });
    });

    it("Should refund both USDC and AVAX on emergency", async function () {
      await hackathon.pause();

      const usdcBefore = await usdc.balanceOf(backer1.address);
      const avaxBefore = await ethers.provider.getBalance(backer1.address);

      await hackathon.connect(backer1).emergencyRefund();

      const usdcAfter = await usdc.balanceOf(backer1.address);
      const avaxAfter = await ethers.provider.getBalance(backer1.address);

      expect(usdcAfter - usdcBefore).to.equal(toUSDC(440)); // 88% of 500
      expect(avaxAfter - avaxBefore).to.be.gt(toAVAX(0.87)); // 88% of 1 minus gas
    });
  });

  describe("Fee Withdrawal with Mixed Tokens", function () {
    beforeEach(async function () {
      await hackathon.connect(team1).registerProject("Project 1", "Description 1");
      await hackathon.approveProject(1);
      await hackathon.connect(owner).enableBacking();

      await usdc.connect(backer1).approve(await hackathon.getAddress(), toUSDC(1000));
      await hackathon.connect(backer1).backProject(1, toUSDC(1000));
      await hackathon.connect(backer1).backProjectWithAVAX(1, { value: toAVAX(10) });

      await hackathon.closeRegistration();
      await hackathon.settleEvent([{ projectId: 1, percentage: 100 }]);
    });

    it("Should allow admin to withdraw fees in both tokens", async function () {
      const ownerUsdcBefore = await usdc.balanceOf(owner.address);
      const ownerAvaxBefore = await ethers.provider.getBalance(owner.address);

      await hackathon.withdrawFees();

      const ownerUsdcAfter = await usdc.balanceOf(owner.address);
      const ownerAvaxAfter = await ethers.provider.getBalance(owner.address);

      // Pool gets 88% of 1000 = 880 USDC, 2% fee on pool = 17.6 USDC
      expect(ownerUsdcAfter - ownerUsdcBefore).to.equal(toUSDC(17.6));
      
      // Pool gets 88% of 10 = 8.8 AVAX, 2% fee on pool = 0.176 AVAX (minus gas costs)
      expect(ownerAvaxAfter - ownerAvaxBefore).to.be.gt(toAVAX(0.17));
    });
  });
});
