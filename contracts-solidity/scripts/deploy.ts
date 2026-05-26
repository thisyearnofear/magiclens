import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // ── 0. MockUSDT (demo only; replace with canonical USDT for production) ─
  let usdtAddress: string;
  const rewardTokenEnv = process.env.REWARD_TOKEN_ADDRESS;

  if (rewardTokenEnv && rewardTokenEnv !== "") {
    usdtAddress = rewardTokenEnv;
    console.log("\n💵 Using provided reward token:", usdtAddress);
  } else {
    console.log("\n💵 Deploying MockUSDT...");
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    usdtAddress = await mockUSDT.getAddress();
    console.log("MockUSDT deployed to:", usdtAddress);

    // Mint tokens to deployer for demo
    await mockUSDT.mint(deployer.address, ethers.parseUnits("10000", 6));
    console.log("Minted 10,000 MockUSDT to deployer");
  }

  // ── 1. WorldCupPack (ERC-1155) ─────────────────────────
  console.log("\n📦 Deploying WorldCupPack...");
  const WorldCupPack = await ethers.getContractFactory("WorldCupPack");
  const worldCupPack = await WorldCupPack.deploy(deployer.address);
  await worldCupPack.waitForDeployment();
  const worldCupPackAddr = await worldCupPack.getAddress();
  console.log("WorldCupPack deployed to:", worldCupPackAddr);

  // Create starter pack types
  console.log("Creating starter pack types...");
  await worldCupPack.createStarterPacks();
  const packCount = await worldCupPack.nextPackTypeId();
  console.log(`Starter packs created. Total pack types: ${packCount}`);

  // ── 2. RemixNFT (ERC-721 + ERC2981) ────────────────────
  console.log("\n🖼️  Deploying RemixNFT...");
  const RemixNFT = await ethers.getContractFactory("RemixNFT");
  const remixNFT = await RemixNFT.deploy(
    deployer.address,      // initialOwner
    worldCupPackAddr,      // worldCupPackAddress (for boost checks)
    250                    // royaltyBps (2.5%)
  );
  await remixNFT.waitForDeployment();
  const remixNFTAddr = await remixNFT.getAddress();
  console.log("RemixNFT deployed to:", remixNFTAddr);

  // ── 3. FanCastRewards ──────────────────────────────────
  console.log("\n🏆 Deploying FanCastRewards...");
  const FanCastRewards = await ethers.getContractFactory("FanCastRewards");
  const fanCastRewards = await FanCastRewards.deploy(
    deployer.address,      // initialOwner
    usdtAddress,           // rewardToken (MockUSDT or canonical USDT)
    remixNFTAddr           // remixNFTAddress
  );
  await fanCastRewards.waitForDeployment();
  const fanCastRewardsAddr = await fanCastRewards.getAddress();
  console.log("FanCastRewards deployed to:", fanCastRewardsAddr);

  // ── 4. Fund rewards pool ───────────────────────────────
  console.log("\n💰 Funding rewards pool...");
  const usdt = await ethers.getContractAt("MockUSDT", usdtAddress);
  await usdt.approve(fanCastRewardsAddr, ethers.parseUnits("1000", 6));
  await fanCastRewards.depositTreasury(ethers.parseUnits("1000", 6));
  console.log("Deposited 1,000 MockUSDT into FanCastRewards");

  // ── Summary ────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("✅ All contracts deployed!");
  console.log("═══════════════════════════════════════════");
  console.log(`Reward Token:     ${usdtAddress}`);
  console.log(`WorldCupPack:     ${worldCupPackAddr}`);
  console.log(`RemixNFT:         ${remixNFTAddr}`);
  console.log(`FanCastRewards:   ${fanCastRewardsAddr}`);
  console.log(`Network:          ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID:         ${(await ethers.provider.getNetwork()).chainId}`);
  console.log("═══════════════════════════════════════════\n");

  console.log("Env vars for frontend:");
  console.log(`VITE_WORLDCUP_PACK_ADDRESS=${worldCupPackAddr}`);
  console.log(`VITE_REMIX_NFT_ADDRESS=${remixNFTAddr}`);
  console.log(`VITE_FAN_CAST_REWARDS_ADDRESS=${fanCastRewardsAddr}`);
  console.log(`VITE_REWARD_TOKEN_ADDRESS=${usdtAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
