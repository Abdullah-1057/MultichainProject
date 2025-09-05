const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy Factory contract
  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed to:", factoryAddress);
  
  // Create first forwarder for current hour
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const salt = ethers.keccak256(ethers.toUtf8Bytes(`hour_${currentHour}`));
  
  const tx = await factory.createForwarder(salt);
  await tx.wait();
  
  const forwarderAddress = await factory.getForwarder(salt);
  console.log("First forwarder created at:", forwarderAddress);
  
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Factory Address:", factoryAddress);
  console.log("Current Forwarder:", forwarderAddress);
  console.log("Admin Address:", deployer.address);
  console.log("\nUpdate your frontend with these addresses!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
