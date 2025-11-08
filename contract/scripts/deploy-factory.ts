import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying BuildBackFactory to Base...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy Factory
  console.log("📦 Deploying BuildBackFactory...");
  const BuildBackFactory = await ethers.getContractFactory("BuildBackFactory");
  const factory = await BuildBackFactory.deploy();
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ BuildBackFactory deployed to:", factoryAddress);
  console.log("👤 Factory owner:", await factory.owner());

  // Save deployment info
  const deploymentInfo = {
    factoryAddress: factoryAddress,
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
  console.log("1. Verify contract on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${factoryAddress}`);
  console.log("2. Update frontend .env with:");
  console.log(`   NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`   NEXT_PUBLIC_CHAIN_ID=${deploymentInfo.chainId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
