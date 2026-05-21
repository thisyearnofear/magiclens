import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MagicLens EVM Contracts", function () {
  async function deployFixture() {
    const [owner, minter, user] = await ethers.getSigners();

    // 1. Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();
    const usdtAddr = await usdt.getAddress();

    // 2. Deploy WorldCupPack
    const WorldCupPack = await ethers.getContractFactory("WorldCupPack");
    const pack = await WorldCupPack.deploy(owner.address);
    await pack.waitForDeployment();
    const packAddr = await pack.getAddress();

    // 3. Deploy RemixNFT
    const RemixNFT = await ethers.getContractFactory("RemixNFT");
    const remix = await RemixNFT.deploy(owner.address, packAddr, 0, 250);
    await remix.waitForDeployment();
    const remixAddr = await remix.getAddress();

    // 4. Deploy FanCastRewards
    const FanCastRewards = await ethers.getContractFactory("FanCastRewards");
    const rewards = await FanCastRewards.deploy(owner.address, usdtAddr, remixAddr);
    await rewards.waitForDeployment();

    return { owner, minter, user, usdt, pack, remix, rewards, packAddr, remixAddr, usdtAddr };
  }

  // ── WorldCupPack Tests ────────────────────────────────────
  describe("WorldCupPack", function () {
    it("should create pack types and enforce max supply", async function () {
      const { pack, user } = await loadFixture(deployFixture);

      // Create starter packs
      await pack.createStarterPacks();
      expect(await pack.nextPackTypeId()).to.equal(6n);

      // Claim a pack
      await pack.connect(user).claimPack(0, 1);
      expect(await pack.balanceOf(user.address, 0)).to.equal(1n);

      // Claim more than max supply should revert (32 total, 1 already claimed = 31 remaining)
      await expect(
        pack.connect(user).claimPack(0, 32) // 32 > 31 remaining
      ).to.be.revertedWith("Exceeds max supply");

      // Claiming non-existent pack should revert
      await expect(
        pack.connect(user).claimPack(99, 1)
      ).to.be.revertedWith("Pack type does not exist");
    });
  });

  // ── RemixNFT Tests ────────────────────────────────────────
  describe("RemixNFT", function () {
    it("should mint remix and enforce pack ownership", async function () {
      const { pack, remix, user } = await loadFixture(deployFixture);
      await pack.createStarterPacks();

      // User cannot mint remix referencing unowned pack
      await expect(
        remix.connect(user).mintRemix(
          1700000000,
          "WC2026_FINAL",
          "ipfs://video",
          "ipfs://thumb",
          [0], // user doesn't own pack 0
          "ipfs://meta/0"
        )
      ).to.be.revertedWith("Sender does not own referenced pack item");

      // User claims pack 0 first
      await pack.connect(user).claimPack(0, 1);

      // Now mint should succeed
      const tx = await remix.connect(user).mintRemix(
        1700000000,
        "WC2026_FINAL",
        "ipfs://video",
        "ipfs://thumb",
        [0],
        "ipfs://meta/0"
      );
      await expect(tx).to.emit(remix, "RemixMinted").withArgs(0, user.address, 1700000000, "WC2026_FINAL", [0]);

      expect(await remix.ownerOf(0)).to.equal(user.address);
      expect(await remix.totalSupply()).to.equal(1n);
    });

    it("should support EIP-2981 royalties", async function () {
      const { remix, owner } = await loadFixture(deployFixture);

      const ERC2981_INTERFACE_ID = "0x2a55205a";
      expect(await remix.supportsInterface(ERC2981_INTERFACE_ID)).to.equal(true);

      const [receiver, amount] = await remix.royaltyInfo(0, ethers.parseEther("1"));
      expect(receiver).to.equal(owner.address);
      expect(amount).to.equal(ethers.parseEther("0.025")); // 2.5%
    });
  });

  // ── FanCastRewards Tests ──────────────────────────────────
  describe("FanCastRewards", function () {
    it("should distribute USDT rewards and emit TopThreeSelected", async function () {
      const { owner, user, usdt, remix, pack, rewards } = await loadFixture(deployFixture);
      await pack.createStarterPacks();

      // Mint some USDT to owner and approve rewards contract
      await usdt.mint(owner.address, ethers.parseUnits("1000", 6));
      await usdt.connect(owner).approve(await rewards.getAddress(), ethers.parseUnits("1000", 6));

      // Deposit into rewards treasury
      await rewards.connect(owner).depositTreasury(ethers.parseUnits("100", 6));

      // Set up winners: mint 3 remixes
      await pack.connect(user).claimPack(0, 1);
      await remix.connect(user).mintRemix(1700000000, "WC_FINAL", "ipfs://v", "ipfs://t", [0], "ipfs://m/0");
      await pack.connect(user).claimPack(1, 1);
      await remix.connect(user).mintRemix(1700000001, "WC_SEMI", "ipfs://v", "ipfs://t", [1], "ipfs://m/1");
      await pack.connect(user).claimPack(2, 1);
      await remix.connect(user).mintRemix(1700000002, "WC_GROUP", "ipfs://v", "ipfs://t", [2], "ipfs://m/2");

      // Distribute rewards
      const tokenIds = [0, 1, 2];
      const winners = [user.address, user.address, user.address];

      const tx = await rewards.connect(owner).distributeRewards(tokenIds, winners);

      // Check TopThreeSelected event
      await expect(tx).to.emit(rewards, "TopThreeSelected").withArgs(
        1, // day
        [0, 1, 2],
        [user.address, user.address, user.address]
      );

      // Check user received USDT
      const balance = await usdt.balanceOf(user.address);
      expect(balance).to.be.gt(0);
      // Top 3 shares: 30% + 20% + 12% = 62% of 100 USDT = 62 USDT
      expect(balance).to.equal(ethers.parseUnits("62", 6));

      // Check total earned tracking
      expect(await rewards.totalEarned(user.address)).to.equal(balance);
    });
  });
});
