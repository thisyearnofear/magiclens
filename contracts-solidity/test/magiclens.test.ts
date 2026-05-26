import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MagicLens EVM Contracts", function () {
  async function deployFixture() {
    const [owner, user, referrer] = await ethers.getSigners();

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

    // 3. Deploy RemixNFT (no mintFee param — free by design)
    const RemixNFT = await ethers.getContractFactory("RemixNFT");
    const remix = await RemixNFT.deploy(owner.address, packAddr, 250);
    await remix.waitForDeployment();
    const remixAddr = await remix.getAddress();

    // 4. Deploy FanCastRewards
    const FanCastRewards = await ethers.getContractFactory("FanCastRewards");
    const rewards = await FanCastRewards.deploy(owner.address, usdtAddr, remixAddr);
    await rewards.waitForDeployment();

    return { owner, user, referrer, usdt, pack, remix, rewards, packAddr, remixAddr, usdtAddr };
  }

  // ── WorldCupPack Tests ────────────────────────────────────
  describe("WorldCupPack", function () {
    it("should create pack types via createStarterPacks", async function () {
      const { pack } = await loadFixture(deployFixture);
      await pack.createStarterPacks();
      expect(await pack.nextPackTypeId()).to.equal(6n);
    });

    it("should allow anyone to claim a free starter pack (once)", async function () {
      const { pack, user } = await loadFixture(deployFixture);
      await pack.createStarterPacks();

      await pack.connect(user).claimStarterPack();

      // User should have 1 of each pack type (6 types)
      for (let i = 0; i < 6; i++) {
        expect(await pack.balanceOf(user.address, i)).to.equal(1n);
      }

      // Second claim should revert
      await expect(
        pack.connect(user).claimStarterPack()
      ).to.be.revertedWith("Starter pack already claimed");
    });

    it("should allow claiming individual packs", async function () {
      const { pack, user } = await loadFixture(deployFixture);
      await pack.createStarterPacks();

      await pack.connect(user).claimPack(0, 3);
      expect(await pack.balanceOf(user.address, 0)).to.equal(3n);
    });

    it("should reject claim of non-existent pack", async function () {
      const { pack, user } = await loadFixture(deployFixture);
      await expect(
        pack.connect(user).claimPack(99, 1)
      ).to.be.revertedWith("Pack type does not exist");
    });
  });

  // ── RemixNFT Tests ────────────────────────────────────────
  describe("RemixNFT", function () {
    it("should allow anyone to mint without owning packs (no gate)", async function () {
      const { remix, user } = await loadFixture(deployFixture);

      const tx = await remix.connect(user).mint(
        "ipfs://meta/0",
        "flag-halos,trophy-confetti",
        [],  // no pack tokens
        ethers.ZeroAddress  // no referrer
      );

      await expect(tx).to.emit(remix, "RemixMinted").withArgs(
        0, user.address, 1, "flag-halos,trophy-confetti", false, ethers.ZeroAddress
      );

      expect(await remix.ownerOf(0)).to.equal(user.address);
      expect(await remix.totalSupply()).to.equal(1n);
      expect(await remix.mintCount(user.address)).to.equal(1n);
    });

    it("should grant pack boost when user owns pack tokens", async function () {
      const { pack, remix, user } = await loadFixture(deployFixture);
      await pack.createStarterPacks();
      await pack.connect(user).claimStarterPack();

      const tx = await remix.connect(user).mint(
        "ipfs://meta/1",
        "flag-halos",
        [0],  // user owns pack type 0
        ethers.ZeroAddress
      );

      await expect(tx).to.emit(remix, "RemixMinted").withArgs(
        0, user.address, 1, "flag-halos", true, ethers.ZeroAddress
      );
    });

    it("should not grant boost for unowned packs", async function () {
      const { remix, user } = await loadFixture(deployFixture);

      const tx = await remix.connect(user).mint(
        "ipfs://meta/2",
        "goal-lower-third",
        [0, 1, 2],  // user doesn't own any
        ethers.ZeroAddress
      );

      await expect(tx).to.emit(remix, "RemixMinted").withArgs(
        0, user.address, 1, "goal-lower-third", false, ethers.ZeroAddress
      );
    });

    it("should track referrals", async function () {
      const { remix, user, referrer } = await loadFixture(deployFixture);

      await remix.connect(user).mint(
        "ipfs://meta/3",
        "trophy-confetti",
        [],
        referrer.address
      );

      expect(await remix.referralCount(referrer.address)).to.equal(1n);
    });

    it("should not count self-referral", async function () {
      const { remix, user } = await loadFixture(deployFixture);

      await remix.connect(user).mint(
        "ipfs://meta/4",
        "sparkles",
        [],
        user.address  // self-referral
      );

      expect(await remix.referralCount(user.address)).to.equal(0n);
    });

    it("should track daily cycles", async function () {
      const { remix, user, owner } = await loadFixture(deployFixture);

      await remix.connect(user).mint("ipfs://d1", "a", [], ethers.ZeroAddress);
      expect((await remix.remixes(0)).day).to.equal(1n);

      await remix.connect(owner).advanceDay();
      await remix.connect(user).mint("ipfs://d2", "b", [], ethers.ZeroAddress);
      expect((await remix.remixes(1)).day).to.equal(2n);
    });

    it("should support EIP-2981 royalties", async function () {
      const { remix, owner } = await loadFixture(deployFixture);

      const ERC2981_INTERFACE_ID = "0x2a55205a";
      expect(await remix.supportsInterface(ERC2981_INTERFACE_ID)).to.equal(true);

      const [receiver, amount] = await remix.royaltyInfo(0, ethers.parseEther("1"));
      expect(receiver).to.equal(owner.address);
      expect(amount).to.equal(ethers.parseEther("0.025"));
    });
  });

  // ── FanCastRewards Tests ──────────────────────────────────
  describe("FanCastRewards", function () {
    it("should distribute USDT rewards and emit TopThreeSelected", async function () {
      const { owner, user, usdt, remix, rewards } = await loadFixture(deployFixture);

      // Mint USDT and fund rewards
      await usdt.mint(owner.address, ethers.parseUnits("1000", 6));
      await usdt.connect(owner).approve(await rewards.getAddress(), ethers.parseUnits("1000", 6));
      await rewards.connect(owner).depositTreasury(ethers.parseUnits("100", 6));

      // Mint 3 remixes (no pack required now!)
      await remix.connect(user).mint("ipfs://r0", "a", [], ethers.ZeroAddress);
      await remix.connect(user).mint("ipfs://r1", "b", [], ethers.ZeroAddress);
      await remix.connect(user).mint("ipfs://r2", "c", [], ethers.ZeroAddress);

      // Distribute rewards
      const tx = await rewards.connect(owner).distributeRewards(
        [0, 1, 2],
        [user.address, user.address, user.address]
      );

      await expect(tx).to.emit(rewards, "TopThreeSelected").withArgs(
        1,
        [0, 1, 2],
        [user.address, user.address, user.address]
      );

      // Top 3 shares: 30% + 20% + 12% = 62% of 100 USDT
      const balance = await usdt.balanceOf(user.address);
      expect(balance).to.equal(ethers.parseUnits("62", 6));
      expect(await rewards.totalEarned(user.address)).to.equal(balance);
    });
  });
});
