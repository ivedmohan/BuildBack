import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Avalanche Fuji Testnet USDC address
const FUJI_USDC_ADDRESS = process.env.USDC_TOKEN_ADDRESS || "0x5425890298aed601595a70AB815c96711a31Bc65";

async function main() {
  console.log("🚀 Deploying BuildBackFactory to Avalanche Fuji...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX\n");
  console.log("USDC Token Address:", FUJI_USDC_ADDRESS, "\n");

  // Deploy Factory
  console.log("📦 Deploying BuildBackFactory...");
  const BuildBackFactory = await ethers.getContractFactory("BuildBackFactory");
  const factory = await BuildBackFactory.deploy(FUJI_USDC_ADDRESS);
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ BuildBackFactory deployed to:", factoryAddress);
  console.log("👤 Factory owner:", await factory.owner());
  console.log("💵 USDC Token:", await factory.usdcToken());

  // Save deployment info
  const deploymentInfo = {
    factoryAddress: factoryAddress,
    usdcTokenAddress: FUJI_USDC_ADDRESS,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "factory.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to deployments/factory.json");
  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Get testnet USDC from faucet:");
  console.log("   https://core.app/tools/testnet-faucet/?token=usdc");
  console.log("2. Verify contract on Snowtrace:");
  console.log(`   npx hardhat verify --network fuji ${factoryAddress} "${FUJI_USDC_ADDRESS}"`);
  console.log("3. Update frontend .env with:");
  console.log(`   NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`   NEXT_PUBLIC_USDC_ADDRESS=${FUJI_USDC_ADDRESS}`);
  console.log(`   NEXT_PUBLIC_CHAIN_ID=${deploymentInfo.chainId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
