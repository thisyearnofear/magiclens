import { ethers } from "hardhat";

// Standalone deploy for CreatorPass — does NOT touch RemixNFT/WorldCupPack.
// Usage: npx hardhat run scripts/deploy-creator-pass.ts --network xlayerTestnet
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CreatorPass with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "OKB");

  const price = ethers.parseEther(process.env.CREATOR_PASS_PRICE || "0.01");
  const maxSupply = Number(process.env.CREATOR_PASS_MAX_SUPPLY || "0");
  const uri =
    process.env.CREATOR_PASS_URI ||
    "https://magiclens.vercel.app/metadata/creator-pass.json";

  console.log(`Price: ${ethers.formatEther(price)} OKB · maxSupply: ${maxSupply || "unlimited"} · uri: ${uri}`);

  const CreatorPass = await ethers.getContractFactory("CreatorPass");
  const pass = await CreatorPass.deploy(deployer.address, price, maxSupply, uri);
  await pass.waitForDeployment();

  const addr = await pass.getAddress();
  console.log("CreatorPass deployed to:", addr);
  console.log(`\nSet NEXT_PUBLIC_CREATOR_PASS_ADDRESS=${addr}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
