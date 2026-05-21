
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Funding rewards pool from:", deployer.address);

  const MOCK_USDT = "0x117cA0AFaE17F5bE8142EEeACFDB89B148154a2D";
  const REWARDS = "0xeDCDc2d8aEE4cF9Df025495cf8c39c93E7CBEb8c";

  const usdt = await ethers.getContractAt("MockUSDT", MOCK_USDT);
  const rewards = await ethers.getContractAt("FanCastRewards", REWARDS);

  // Check deployer balance
  const bal = await usdt.balanceOf(deployer.address);
  console.log("Deployer MockUSDT balance:", ethers.formatUnits(bal, 6));

  // Approve rewards contract to spend 1000 USDT
  const depositAmount = ethers.parseUnits("1000", 6);
  console.log("Approving", ethers.formatUnits(depositAmount, 6), "MockUSDT for rewards contract...");
  const approveTx = await usdt.connect(deployer).approve(REWARDS, depositAmount);
  await approveTx.wait();
  console.log("Approval tx:", approveTx.hash);

  // Deposit into rewards pool
  console.log("Depositing to FanCastRewards...");
  const depositTx = await rewards.connect(deployer).depositTreasury(depositAmount);
  await depositTx.wait();
  console.log("Deposit tx:", depositTx.hash);

  // Verify
  const result = await rewards.dailyResults(1);
  // Alternatively, just check the pool
  const pool = await rewards.currentDayRewardPool();
  console.log("\n✅ Rewards pool funded!");
  console.log("Current day reward pool:", ethers.formatUnits(pool, 6), "MockUSDT");
  console.log("Current day:", (await rewards.currentDay()).toString());
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
