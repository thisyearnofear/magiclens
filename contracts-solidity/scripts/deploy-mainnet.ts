import { ethers } from "hardhat";

// Mainnet (X Layer chain 196) deployment for TapeOut Accelerate submission —
// makes "minted on X Layer" literally true for judges.
// Usage: npx hardhat run scripts/deploy-mainnet.ts --network xlayerMainnet
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "OKB");
  if (balance === 0n) throw new Error("Deployer has no OKB on X Layer mainnet — fund 0x" + deployer.address.slice(2));

  // ── 1. WorldCupPack (ERC-1155, free-claim boost badge — keeps name for
  //        contract parity with testnet; user-facing copy stays generic) ──
  console.log("\n📦 Deploying WorldCupPack...");
  const WorldCupPack = await ethers.getContractFactory("WorldCupPack");
  const pack = await WorldCupPack.deploy(deployer.address);
  await pack.waitForDeployment();
  const packAddr = await pack.getAddress();
  console.log("WorldCupPack:", packAddr);

  console.log("Creating starter packs...");
  await (await pack.createStarterPacks()).wait();

  // ── 2. RemixNFT (ERC-721, free user mints) ────────────────────────────
  console.log("\n🎬 Deploying RemixNFT...");
  const RemixNFT = await ethers.getContractFactory("RemixNFT");
  const remix = await RemixNFT.deploy(deployer.address, packAddr, 250);
  await remix.waitForDeployment();
  const remixAddr = await remix.getAddress();
  console.log("RemixNFT:", remixAddr);

  // ── 3. CreatorPass (priced Pro pass) ──────────────────────────────────
  const price = ethers.parseEther(process.env.CREATOR_PASS_PRICE || "0.01");
  const uri = process.env.CREATOR_PASS_URI || "https://magiclens.vercel.app/metadata/creator-pass.json";
  console.log("\n⚡ Deploying CreatorPass...");
  const CreatorPass = await ethers.getContractFactory("CreatorPass");
  const pass = await CreatorPass.deploy(deployer.address, price, 0, uri);
  await pass.waitForDeployment();
  const passAddr = await pass.getAddress();
  console.log("CreatorPass:", passAddr);

  console.log("\n=== MAINNET ENV BLOCK ===");
  console.log(`NEXT_PUBLIC_WORLDCUP_PACK_ADDRESS=${packAddr}`);
  console.log(`NEXT_PUBLIC_REMIX_NFT_ADDRESS=${remixAddr}`);
  console.log(`NEXT_PUBLIC_CREATOR_PASS_ADDRESS=${passAddr}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
