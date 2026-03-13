const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

/**
 * ═══════════════════════════════════════════════════════════
 *   ERC8183Escrow — Comprehensive Production-Ready Test Suite
 *   Covers: All lifecycle paths, access control, edge cases, gas
 * ═══════════════════════════════════════════════════════════
 */
describe("ERC8183Escrow", function () {
  // ─── Constants ───────────────────────────────────────────
  const BUDGET_USDC = ethers.parseUnits("500", 6);  // 500 USDC  (6 decimals, like Base USDC)
  const FEE_BPS = 100n;                              // 1%
  const ONE_WEEK = 7 * 24 * 60 * 60;
  const ZERO_ADDRESS = ethers.ZeroAddress;
  const ZERO_BYTES32 = ethers.ZeroHash;

  // ─── Fixture ─────────────────────────────────────────────
  async function deployFixture() {
    const [owner, client, provider, evaluator, treasury, stranger] =
      await ethers.getSigners();

    // Deploy MockERC20 (6 dec = USDC-style, matching Base mainnet USDC)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    // Deploy MockACPHook
    const MockACPHook = await ethers.getContractFactory("MockACPHook");
    const hook = await MockACPHook.deploy();

    // Deploy ERC8183Escrow
    const ERC8183Escrow = await ethers.getContractFactory("ERC8183Escrow");
    const escrow = await ERC8183Escrow.deploy(
      await usdc.getAddress(),
      treasury.address,
      FEE_BPS,
      owner.address   // deployer
    );

    // Fund client with USDC and approve escrow
    await usdc.mint(client.address, ethers.parseUnits("100000", 6));
    await usdc.connect(client).approve(await escrow.getAddress(), ethers.MaxUint256);

    const now = await time.latest();
    const expiredAt = now + ONE_WEEK;

    return {
      escrow, usdc, hook,
      owner, client, provider, evaluator, treasury, stranger,
      expiredAt,
    };
  }

  // ─── Helper ───────────────────────────────────────────────
  async function createOpenJob(escrow, client, provider, evaluator, expiredAt, hookAddr) {
    const tx = await escrow.connect(client).createJob(
      provider.address ?? ZERO_ADDRESS,
      evaluator.address,
      ZERO_ADDRESS,        // paymentToken param (logged in event, not stored separately)
      expiredAt,
      "Audit the Uniswap V4 pool hooks",
      hookAddr ?? ZERO_ADDRESS
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(l => {
      try { return escrow.interface.parseLog(l)?.name === "JobCreated"; } catch { return false; }
    });
    const parsed = escrow.interface.parseLog(event);
    return { tx, receipt, jobId: parsed.args.jobId };
  }

  async function fundJob(escrow, usdc, client, jobId, budget) {
    // Set budget first if needed
    await escrow.connect(client).setBudget(jobId, budget, "0x");
    await escrow.connect(client).fund(jobId, budget, "0x");
  }

  // ═══════════════════════════════════════════════════════╗
  //  1. DEPLOYMENT                                         ║
  // ═══════════════════════════════════════════════════════╝
  describe("Deployment", function () {
    it("should set immutable variables correctly", async function () {
      const { escrow, usdc, treasury, owner } = await loadFixture(deployFixture);
      expect(await escrow.paymentToken()).to.equal(await usdc.getAddress());
      expect(await escrow.treasury()).to.equal(treasury.address);
      expect(await escrow.feeBps()).to.equal(FEE_BPS);
      expect(await escrow.deployer()).to.equal(owner.address);
      expect(await escrow.nextJobId()).to.equal(0n);
    });

    it("should revert with ZeroAddress if paymentToken is zero", async function () {
      const [owner, , , , treasury] = await ethers.getSigners();
      const ERC8183Escrow = await ethers.getContractFactory("ERC8183Escrow");
      await expect(
        ERC8183Escrow.deploy(ZERO_ADDRESS, treasury.address, FEE_BPS, owner.address)
      ).to.be.revertedWithCustomError(
        await ERC8183Escrow.deploy(await (await (await ethers.getContractFactory("MockERC20")).deploy("t","t",6)).getAddress(), treasury.address, 0n, owner.address),
        "ZeroAddress"
      ).catch(async () => {
        const dummy = await (await ethers.getContractFactory("MockERC20")).deploy("t","t",6);
        const e = await ERC8183Escrow.deploy(await dummy.getAddress(), treasury.address, 0n, owner.address);
        await expect(
          ERC8183Escrow.deploy(ZERO_ADDRESS, treasury.address, FEE_BPS, owner.address)
        ).to.be.revertedWithCustomError(e, "ZeroAddress");
      });
    });

    it("should revert with ZeroAddress if treasury is zero", async function () {
      const { owner } = await loadFixture(deployFixture);
      const usdc2 = await (await ethers.getContractFactory("MockERC20")).deploy("t","t",6);
      const ERC8183Escrow = await ethers.getContractFactory("ERC8183Escrow");
      const dummy = await ERC8183Escrow.deploy(await usdc2.getAddress(), (await ethers.getSigners())[4].address, 0n, owner.address);
      await expect(
        ERC8183Escrow.deploy(await usdc2.getAddress(), ZERO_ADDRESS, FEE_BPS, owner.address)
      ).to.be.revertedWithCustomError(dummy, "ZeroAddress");
    });

    it("should revert with FeeTooHigh if feeBps > 200", async function () {
      const { escrow, usdc, treasury, owner } = await loadFixture(deployFixture);
      const ERC8183Escrow = await ethers.getContractFactory("ERC8183Escrow");
      await expect(
        ERC8183Escrow.deploy(await usdc.getAddress(), treasury.address, 201n, owner.address)
      ).to.be.revertedWithCustomError(escrow, "FeeTooHigh");
    });

    it("⛽ [GAS] deployment cost", async function () {
      const { escrow, usdc, treasury, owner } = await loadFixture(deployFixture);
      const ERC8183Escrow = await ethers.getContractFactory("ERC8183Escrow");
      const tx = await ERC8183Escrow.getDeployTransaction(
        await usdc.getAddress(),
        treasury.address,
        FEE_BPS,
        owner.address
      );
      const est = await ethers.provider.estimateGas(tx);
      console.log(`    ⛽ Deploy gas: ${est.toLocaleString()}`);
      expect(est).to.be.lt(3_000_000n); // sanity ceiling
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  2. createJob                                          ║
  // ═══════════════════════════════════════════════════════╝
  describe("createJob", function () {
    it("should emit JobCreated with correct args and increment jobId", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      await expect(
        escrow.connect(client).createJob(
          provider.address, evaluator.address, ZERO_ADDRESS,
          expiredAt, "Audit AMM pool", ZERO_ADDRESS
        )
      )
        .to.emit(escrow, "JobCreated")
        .withArgs(0n, client.address, provider.address, evaluator.address, ZERO_ADDRESS, expiredAt);
      expect(await escrow.nextJobId()).to.equal(1n);
    });

    it("should create job in Open status with zero budget", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      const job = await escrow.getJob(jobId);
      expect(job.client).to.equal(client.address);
      expect(job.provider).to.equal(provider.address);
      expect(job.evaluator).to.equal(evaluator.address);
      expect(job.budget).to.equal(0n);
      expect(job.status).to.equal(0n); // Open = 0
    });

    it("should allow creating job with zero provider (open marketplace)", async function () {
      const { escrow, client, evaluator, expiredAt } = await loadFixture(deployFixture);
      const tx = await escrow.connect(client).createJob(
        ZERO_ADDRESS, evaluator.address, ZERO_ADDRESS, expiredAt, "Open bid job", ZERO_ADDRESS
      );
      await expect(tx).to.emit(escrow, "JobCreated");
    });

    it("should revert with ZeroAddress if evaluator is zero", async function () {
      const { escrow, client, expiredAt } = await loadFixture(deployFixture);
      await expect(
        escrow.connect(client).createJob(
          ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, expiredAt, "bad job", ZERO_ADDRESS
        )
      ).to.be.revertedWithCustomError(escrow, "ZeroAddress");
    });

    it("should revert with InvalidExpiry if expiredAt <= block.timestamp", async function () {
      const { escrow, client, evaluator } = await loadFixture(deployFixture);
      const past = (await time.latest()) - 1;
      await expect(
        escrow.connect(client).createJob(
          ZERO_ADDRESS, evaluator.address, ZERO_ADDRESS, past, "expired job", ZERO_ADDRESS
        )
      ).to.be.revertedWithCustomError(escrow, "InvalidExpiry");
    });

    it("⛽ [GAS] createJob cost", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const tx = await escrow.connect(client).createJob(
        provider.address, evaluator.address, ZERO_ADDRESS,
        expiredAt, "Audit smart contract", ZERO_ADDRESS
      );
      const r = await tx.wait();
      console.log(`    ⛽ createJob gas: ${r.gasUsed.toLocaleString()}`);
      expect(r.gasUsed).to.be.lt(200_000n);
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  3. setProvider                                        ║
  // ═══════════════════════════════════════════════════════╝
  describe("setProvider", function () {
    it("should allow client to set provider and emit ProviderSet", async function () {
      const { escrow, client, evaluator, provider, expiredAt } = await loadFixture(deployFixture);
      // Create with no provider
      await escrow.connect(client).createJob(
        ZERO_ADDRESS, evaluator.address, ZERO_ADDRESS, expiredAt, "Open job", ZERO_ADDRESS
      );
      await expect(escrow.connect(client).setProvider(0n, provider.address, "0x"))
        .to.emit(escrow, "ProviderSet").withArgs(0n, provider.address);
    });

    it("should revert if not client", async function () {
      const { escrow, client, provider, evaluator, expiredAt, stranger } = await loadFixture(deployFixture);
      await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await expect(
        escrow.connect(stranger).setProvider(0n, provider.address, "0x")
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should revert ProviderAlreadySet when provider already assigned", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await expect(
        escrow.connect(client).setProvider(jobId, provider.address, "0x")
      ).to.be.revertedWithCustomError(escrow, "ProviderAlreadySet");
    });

    it("should revert ZeroAddress if provider is zero", async function () {
      const { escrow, client, evaluator, expiredAt } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(
        ZERO_ADDRESS, evaluator.address, ZERO_ADDRESS, expiredAt, "open", ZERO_ADDRESS
      );
      await expect(
        escrow.connect(client).setProvider(0n, ZERO_ADDRESS, "0x")
      ).to.be.revertedWithCustomError(escrow, "ZeroAddress");
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  4. setBudget                                          ║
  // ═══════════════════════════════════════════════════════╝
  describe("setBudget", function () {
    it("should allow client to set budget", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await expect(escrow.connect(client).setBudget(jobId, BUDGET_USDC, "0x"))
        .to.emit(escrow, "BudgetSet").withArgs(jobId, BUDGET_USDC);
      const job = await escrow.getJob(jobId);
      expect(job.budget).to.equal(BUDGET_USDC);
    });

    it("should allow provider to set budget", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await expect(escrow.connect(provider).setBudget(jobId, BUDGET_USDC, "0x"))
        .to.emit(escrow, "BudgetSet");
    });

    it("should revert if stranger calls setBudget", async function () {
      const { escrow, client, provider, evaluator, expiredAt, stranger } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await expect(
        escrow.connect(stranger).setBudget(jobId, BUDGET_USDC, "0x")
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should revert if status is not Open", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);
      await expect(
        escrow.connect(client).setBudget(jobId, BUDGET_USDC, "0x")
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  5. fund                                               ║
  // ═══════════════════════════════════════════════════════╝
  describe("fund", function () {
    it("should transfer tokens into escrow and emit JobFunded", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await escrow.connect(client).setBudget(jobId, BUDGET_USDC, "0x");

      const escrowAddr = await escrow.getAddress();
      const beforeBalance = await usdc.balanceOf(escrowAddr);

      await expect(escrow.connect(client).fund(jobId, BUDGET_USDC, "0x"))
        .to.emit(escrow, "JobFunded").withArgs(jobId, client.address, BUDGET_USDC);

      expect(await usdc.balanceOf(escrowAddr)).to.equal(beforeBalance + BUDGET_USDC);
      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(1n); // Funded
    });

    it("should revert BudgetMismatch if expectedBudget differs", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await escrow.connect(client).setBudget(jobId, BUDGET_USDC, "0x");
      await expect(
        escrow.connect(client).fund(jobId, BUDGET_USDC + 1n, "0x")
      ).to.be.revertedWithCustomError(escrow, "BudgetMismatch");
    });

    it("should revert ZeroBudget if budget not set", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await expect(
        escrow.connect(client).fund(jobId, 0n, "0x")
      ).to.be.revertedWithCustomError(escrow, "ZeroBudget");
    });

    it("should revert ProviderNotSet if provider is zero", async function () {
      const { escrow, client, evaluator, expiredAt } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(
        ZERO_ADDRESS, evaluator.address, ZERO_ADDRESS, expiredAt, "open", ZERO_ADDRESS
      );
      await escrow.connect(client).setBudget(0n, BUDGET_USDC, "0x");
      await expect(
        escrow.connect(client).fund(0n, BUDGET_USDC, "0x")
      ).to.be.revertedWithCustomError(escrow, "ProviderNotSet");
    });

    it("should revert Unauthorized if not client", async function () {
      const { escrow, client, provider, evaluator, expiredAt, stranger } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await escrow.connect(client).setBudget(jobId, BUDGET_USDC, "0x");
      await expect(
        escrow.connect(stranger).fund(jobId, BUDGET_USDC, "0x")
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("⛽ [GAS] fund cost", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await escrow.connect(client).setBudget(jobId, BUDGET_USDC, "0x");
      const tx = await escrow.connect(client).fund(jobId, BUDGET_USDC, "0x");
      const r = await tx.wait();
      console.log(`    ⛽ fund gas: ${r.gasUsed.toLocaleString()}`);
      expect(r.gasUsed).to.be.lt(150_000n);
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  6. submit                                             ║
  // ═══════════════════════════════════════════════════════╝
  describe("submit", function () {
    const DELIVERABLE = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmHash12345"));

    it("should set deliverable and transition to Submitted", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);

      await expect(escrow.connect(provider).submit(jobId, DELIVERABLE, "0x"))
        .to.emit(escrow, "JobSubmitted").withArgs(jobId, provider.address, DELIVERABLE);

      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(2n); // Submitted
      expect(job.deliverable).to.equal(DELIVERABLE);
    });

    it("should revert if not provider", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt, stranger } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);
      await expect(
        escrow.connect(stranger).submit(jobId, DELIVERABLE, "0x")
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should revert if status is not Funded", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await expect(
        escrow.connect(provider).submit(jobId, DELIVERABLE, "0x")
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  7. complete                                           ║
  // ═══════════════════════════════════════════════════════╝
  describe("complete", function () {
    const REASON = ethers.keccak256(ethers.toUtf8Bytes("Quality work, approved."));
    const DELIVERABLE = ethers.keccak256(ethers.toUtf8Bytes("ipfs://delivery"));

    async function submitReadyJob(fixture) {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = fixture;
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);
      await escrow.connect(provider).submit(jobId, DELIVERABLE, "0x");
      return jobId;
    }

    it("should release payout to provider and fee to treasury", async function () {
      const fixture = await loadFixture(deployFixture);
      const { escrow, usdc, provider, evaluator, treasury } = fixture;
      const jobId = await submitReadyJob(fixture);

      const expectedFee = (BUDGET_USDC * FEE_BPS) / 10_000n;
      const expectedPayout = BUDGET_USDC - expectedFee;

      const providerBefore = await usdc.balanceOf(provider.address);
      const treasuryBefore = await usdc.balanceOf(treasury.address);

      await expect(escrow.connect(evaluator).complete(jobId, REASON, "0x"))
        .to.emit(escrow, "JobCompleted").withArgs(jobId, evaluator.address, REASON)
        .and.to.emit(escrow, "PaymentReleased").withArgs(jobId, provider.address, expectedPayout);

      expect(await usdc.balanceOf(provider.address)).to.equal(providerBefore + expectedPayout);
      expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + expectedFee);

      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(3n); // Completed
    });

    it("should work correctly with 0% fee (no treasury transfer)", async function () {
      const [owner, client, provider, evaluator, treasury] = await ethers.getSigners();
      const usdc = await (await ethers.getContractFactory("MockERC20")).deploy("USDC","USDC",6);
      const escrow = await (await ethers.getContractFactory("ERC8183Escrow")).deploy(
        await usdc.getAddress(), treasury.address, 0n, owner.address
      );
      await usdc.mint(client.address, BUDGET_USDC);
      await usdc.connect(client).approve(await escrow.getAddress(), ethers.MaxUint256);

      const expiredAt = (await time.latest()) + ONE_WEEK;
      const { jobId } = await createOpenJob(escrow, client, { address: provider.address }, { address: evaluator.address }, expiredAt, null);
      await escrow.connect(client).setBudget(jobId, BUDGET_USDC, "0x");
      await escrow.connect(client).fund(jobId, BUDGET_USDC, "0x");
      await escrow.connect(provider).submit(jobId, DELIVERABLE, "0x");

      const before = await usdc.balanceOf(provider.address);
      await escrow.connect(evaluator).complete(jobId, REASON, "0x");
      expect(await usdc.balanceOf(provider.address)).to.equal(before + BUDGET_USDC);
    });

    it("should revert if not evaluator", async function () {
      const fixture = await loadFixture(deployFixture);
      const { escrow, stranger } = fixture;
      const jobId = await submitReadyJob(fixture);
      await expect(
        escrow.connect(stranger).complete(jobId, REASON, "0x")
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should revert if status is not Submitted", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);
      // Still Funded, not Submitted
      await expect(
        escrow.connect(evaluator).complete(jobId, REASON, "0x")
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("⛽ [GAS] complete cost (incl. 2 transfers)", async function () {
      const fixture = await loadFixture(deployFixture);
      const { escrow, evaluator } = fixture;
      const jobId = await submitReadyJob(fixture);
      const tx = await escrow.connect(evaluator).complete(jobId, REASON, "0x");
      const r = await tx.wait();
      console.log(`    ⛽ complete gas: ${r.gasUsed.toLocaleString()}`);
      expect(r.gasUsed).to.be.lt(200_000n);
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  8. reject                                             ║
  // ═══════════════════════════════════════════════════════╝
  describe("reject", function () {
    const REASON = ethers.keccak256(ethers.toUtf8Bytes("Deliverable not met."));
    const DELIVERABLE = ethers.keccak256(ethers.toUtf8Bytes("ipfs://delivery"));

    it("client can reject Open job without refund", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await expect(escrow.connect(client).reject(jobId, REASON, "0x"))
        .to.emit(escrow, "JobRejected").withArgs(jobId, client.address, REASON);
      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(4n); // Rejected
    });

    it("evaluator can reject Funded job and trigger refund to client", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);

      const clientBefore = await usdc.balanceOf(client.address);
      await expect(escrow.connect(evaluator).reject(jobId, REASON, "0x"))
        .to.emit(escrow, "Refunded").withArgs(jobId, client.address, BUDGET_USDC)
        .and.to.emit(escrow, "JobRejected");
      expect(await usdc.balanceOf(client.address)).to.equal(clientBefore + BUDGET_USDC);
    });

    it("evaluator can reject Submitted job and trigger refund", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);
      await escrow.connect(provider).submit(jobId, DELIVERABLE, "0x");

      const clientBefore = await usdc.balanceOf(client.address);
      await escrow.connect(evaluator).reject(jobId, REASON, "0x");
      expect(await usdc.balanceOf(client.address)).to.equal(clientBefore + BUDGET_USDC);
    });

    it("stranger cannot reject", async function () {
      const { escrow, client, provider, evaluator, expiredAt, stranger } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await expect(
        escrow.connect(stranger).reject(jobId, REASON, "0x")
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("cannot reject a Completed job", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);
      await escrow.connect(provider).submit(jobId, DELIVERABLE, "0x");
      await escrow.connect(evaluator).complete(jobId, ZERO_BYTES32, "0x");
      await expect(
        escrow.connect(evaluator).reject(jobId, REASON, "0x")
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  9. claimRefund (expiry)                               ║
  // ═══════════════════════════════════════════════════════╝
  describe("claimRefund", function () {
    it("should refund client after expiry on Funded job", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);

      // Time travel past expiry
      await time.increaseTo(expiredAt + 1);

      const clientBefore = await usdc.balanceOf(client.address);
      await expect(escrow.connect(client).claimRefund(jobId))
        .to.emit(escrow, "JobExpired").withArgs(jobId)
        .and.to.emit(escrow, "Refunded").withArgs(jobId, client.address, BUDGET_USDC);
      expect(await usdc.balanceOf(client.address)).to.equal(clientBefore + BUDGET_USDC);

      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(5n); // Expired
    });

    it("should refund client after expiry on Submitted job", async function () {
      const DELIVERABLE = ethers.keccak256(ethers.toUtf8Bytes("ipfs://delivery"));
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);
      await escrow.connect(provider).submit(jobId, DELIVERABLE, "0x");
      await time.increaseTo(expiredAt + 1);
      await expect(escrow.connect(client).claimRefund(jobId))
        .to.emit(escrow, "Refunded");
    });

    it("should revert NotExpired before expiry", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);
      await expect(escrow.connect(client).claimRefund(jobId))
        .to.be.revertedWithCustomError(escrow, "NotExpired");
    });

    it("should revert InvalidStatus if job is Open (not Funded)", async function () {
      const { escrow, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await time.increaseTo(expiredAt + 1);
      await expect(escrow.connect(client).claimRefund(jobId))
        .to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  10. Admin Functions                                   ║
  // ═══════════════════════════════════════════════════════╝
  describe("Admin", function () {
    it("deployer can updateFee up to 200 bps", async function () {
      const { escrow, owner } = await loadFixture(deployFixture);
      await escrow.connect(owner).updateFee(200n);
      expect(await escrow.feeBps()).to.equal(200n);
    });

    it("should revert FeeTooHigh if >200 bps", async function () {
      const { escrow, owner } = await loadFixture(deployFixture);
      await expect(escrow.connect(owner).updateFee(201n))
        .to.be.revertedWithCustomError(escrow, "FeeTooHigh");
    });

    it("deployer can updateTreasury", async function () {
      const { escrow, owner, stranger } = await loadFixture(deployFixture);
      await escrow.connect(owner).updateTreasury(stranger.address);
      expect(await escrow.treasury()).to.equal(stranger.address);
    });

    it("should revert ZeroAddress on updateTreasury(0x0)", async function () {
      const { escrow, owner } = await loadFixture(deployFixture);
      await expect(escrow.connect(owner).updateTreasury(ZERO_ADDRESS))
        .to.be.revertedWithCustomError(escrow, "ZeroAddress");
    });

    it("non-deployer cannot call admin functions", async function () {
      const { escrow, stranger } = await loadFixture(deployFixture);
      await expect(escrow.connect(stranger).updateFee(0n))
        .to.be.revertedWithCustomError(escrow, "Unauthorized");
      await expect(escrow.connect(stranger).updateTreasury(stranger.address))
        .to.be.revertedWithCustomError(escrow, "Unauthorized");
      await expect(escrow.connect(stranger).setReputationRegistry(ZERO_ADDRESS))
        .to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("deployer can set reputation registry", async function () {
      const { escrow, owner, stranger } = await loadFixture(deployFixture);
      await escrow.connect(owner).setReputationRegistry(stranger.address);
      expect(await escrow.reputationRegistry()).to.equal(stranger.address);
    });

    it("deployer can disable reputation registry with address(0)", async function () {
      const { escrow, owner, stranger } = await loadFixture(deployFixture);
      await escrow.connect(owner).setReputationRegistry(stranger.address);
      await escrow.connect(owner).setReputationRegistry(ZERO_ADDRESS);
      expect(await escrow.reputationRegistry()).to.equal(ZERO_ADDRESS);
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  11. Hook Integration                                  ║
  // ═══════════════════════════════════════════════════════╝
  describe("Hook Integration", function () {
    it("should invoke beforeAction and afterAction on setProvider", async function () {
      const { escrow, client, evaluator, provider, expiredAt, hook } = await loadFixture(deployFixture);
      const hookAddr = await hook.getAddress();
      await escrow.connect(client).createJob(
        ZERO_ADDRESS, evaluator.address, ZERO_ADDRESS, expiredAt, "hook test", hookAddr
      );
      await escrow.connect(client).setProvider(0n, provider.address, "0x");
      expect(await hook.beforeCount()).to.equal(1n);
      expect(await hook.afterCount()).to.equal(1n);
    });

    it("should invoke hooks on fund", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt, hook } = await loadFixture(deployFixture);
      const hookAddr = await hook.getAddress();
      await escrow.connect(client).createJob(
        provider.address, evaluator.address, ZERO_ADDRESS, expiredAt, "hook fund", hookAddr
      );
      await escrow.connect(client).setBudget(0n, BUDGET_USDC, "0x");
      await escrow.connect(client).fund(0n, BUDGET_USDC, "0x");
      expect(await hook.beforeCount()).to.be.gte(1n);
    });

    it("should revert when hook reverts on beforeAction", async function () {
      const { escrow, client, evaluator, provider, expiredAt, hook } = await loadFixture(deployFixture);
      const hookAddr = await hook.getAddress();
      await escrow.connect(client).createJob(
        ZERO_ADDRESS, evaluator.address, ZERO_ADDRESS, expiredAt, "revert hook", hookAddr
      );
      await hook.setShouldRevert(true);
      await expect(
        escrow.connect(client).setProvider(0n, provider.address, "0x")
      ).to.be.reverted; // hook reverts bubble up
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  12. getJob — Frontend ABI Alignment                   ║
  // ═══════════════════════════════════════════════════════╝
  describe("getJob — Frontend ABI Alignment", function () {
    it("should return paymentToken as 5th return value (index 4)", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      const result = await escrow.getJob(jobId);
      // Frontend ABI: [client, provider, evaluator, hook, paymentToken, budget, expiredAt, description, deliverable, status]
      expect(result[0]).to.equal(client.address);           // client
      expect(result[1]).to.equal(provider.address);         // provider
      expect(result[2]).to.equal(evaluator.address);        // evaluator
      expect(result[3]).to.equal(ZERO_ADDRESS);             // hook
      expect(result[4]).to.equal(await usdc.getAddress());  // paymentToken ← frontend needs this
      expect(result[5]).to.equal(0n);                       // budget
      expect(result[7]).to.equal("Audit the Uniswap V4 pool hooks"); // description
      expect(result[8]).to.equal(ZERO_BYTES32);             // deliverable
      expect(result[9]).to.equal(0n);                       // status = Open
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  13. Full Lifecycle Happy Path (Integration)           ║
  //  Mirrors exact frontend flow: wagmi writeContract      ║
  // ═══════════════════════════════════════════════════════╝
  describe("Full Lifecycle — Happy Path Integration", function () {
    it("Open → fund → submit → complete with fee split", async function () {
      const { escrow, usdc, client, provider, evaluator, treasury, expiredAt } = await loadFixture(deployFixture);
      const escrowAddr = await escrow.getAddress();

      // ── Step 1: client.createJob (frontend: createJob wagmi call) ──
      const tx1 = await escrow.connect(client).createJob(
        provider.address,
        evaluator.address,
        await usdc.getAddress(),   // paymentToken logged in event
        expiredAt,
        "Build an automated trading bot strategy integrating DEX aggregators.",
        ZERO_ADDRESS
      );
      const r1 = await tx1.wait();
      const createEvent = r1.logs
        .map(l => { try { return escrow.interface.parseLog(l); } catch { return null; } })
        .find(e => e?.name === "JobCreated");
      const jobId = createEvent.args.jobId;
      expect(jobId).to.equal(0n);

      // ── Step 2: client.setBudget ──
      const BUDGET = ethers.parseUnits("2500", 6); // 2500 USDC like dummy data
      await escrow.connect(client).setBudget(jobId, BUDGET, "0x");

      // ── Step 3: client.approve + fund (frontend: approve then fund) ──
      // approve already done in fixture
      await escrow.connect(client).fund(jobId, BUDGET, "0x");
      expect(await usdc.balanceOf(escrowAddr)).to.equal(BUDGET);

      // ── Step 4: provider.submit (stores IPFS hash as bytes32) ──
      const deliverable = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmTradingBotHash"));
      await escrow.connect(provider).submit(jobId, deliverable, "0x");

      // ── Step 5: evaluator.complete ──
      const reason = ethers.keccak256(ethers.toUtf8Bytes("Excellent logic and code quality."));
      const fee = (BUDGET * FEE_BPS) / 10_000n;
      const payout = BUDGET - fee;

      const providerBefore = await usdc.balanceOf(provider.address);
      const treasuryBefore = await usdc.balanceOf(treasury.address);

      await escrow.connect(evaluator).complete(jobId, reason, "0x");

      expect(await usdc.balanceOf(provider.address)).to.equal(providerBefore + payout);
      expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + fee);
      expect(await usdc.balanceOf(escrowAddr)).to.equal(0n); // escrow drains completely

      // ── Step 6: verify final state via getJob (same call frontend uses) ──
      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(3n); // Completed
      expect(job.deliverable).to.equal(deliverable);
      expect(job.budget).to.equal(BUDGET);
      expect(job._paymentToken ?? job[4]).to.equal(await usdc.getAddress());

      console.log("    ✅ Full lifecycle PASSED");
      console.log(`    💰 Budget: 2500 USDC | Fee (1%): ${ethers.formatUnits(fee, 6)} USDC | Payout: ${ethers.formatUnits(payout, 6)} USDC`);
    });

    it("Open → fund → evaluator rejects → full refund", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const BUDGET = ethers.parseUnits("500", 6);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET);

      const clientBefore = await usdc.balanceOf(client.address);
      const reason = ethers.keccak256(ethers.toUtf8Bytes("Work not delivered."));
      await escrow.connect(evaluator).reject(jobId, reason, "0x");

      expect(await usdc.balanceOf(client.address)).to.equal(clientBefore + BUDGET);
      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(4n); // Rejected
    });

    it("Open → fund → expire → claimRefund", async function () {
      const { escrow, usdc, client, provider, evaluator, expiredAt } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(escrow, client, provider, evaluator, expiredAt, null);
      await fundJob(escrow, usdc, client, jobId, BUDGET_USDC);

      await time.increaseTo(expiredAt + 1);
      const clientBefore = await usdc.balanceOf(client.address);
      await escrow.connect(client).claimRefund(jobId);
      expect(await usdc.balanceOf(client.address)).to.equal(clientBefore + BUDGET_USDC);
    });
  });

  // ═══════════════════════════════════════════════════════╗
  //  14. Gas Benchmark Summary                             ║
  // ═══════════════════════════════════════════════════════╝
  describe("⛽ Gas Benchmark Summary", function () {
    it("measures gas for all critical state transitions", async function () {
      const { escrow, usdc, client, provider, evaluator, treasury, expiredAt } = await loadFixture(deployFixture);
      const BUDGET = ethers.parseUnits("500", 6);
      const DELIVERABLE = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmBenchmark"));
      const REASON = ethers.keccak256(ethers.toUtf8Bytes("Approved."));

      const measure = async (label, txPromise) => {
        const tx = await txPromise;
        const r = await tx.wait();
        console.log(`    ⛽ ${label.padEnd(20)}: ${r.gasUsed.toLocaleString().padStart(8)} gas`);
        return r.gasUsed;
      };

      const g1 = await measure("createJob",  escrow.connect(client).createJob(
        provider.address, evaluator.address, ZERO_ADDRESS, expiredAt, "Benchmark job", ZERO_ADDRESS
      ));
      const g2 = await measure("setBudget",  escrow.connect(client).setBudget(0n, BUDGET, "0x"));
      const g3 = await measure("fund",       escrow.connect(client).fund(0n, BUDGET, "0x"));
      const g4 = await measure("submit",     escrow.connect(provider).submit(0n, DELIVERABLE, "0x"));
      const g5 = await measure("complete",   escrow.connect(evaluator).complete(0n, REASON, "0x"));

      const total = g1 + g2 + g3 + g4 + g5;
      console.log(`\n    📊 Total happy-path gas: ${total.toLocaleString()}`);
      console.log(`    💡 At 0.001 gwei (Base L2): ~$${(Number(total) * 1e-9 * 0.001 * 2000).toFixed(4)} USD per full lifecycle`);

      // All within reasonable limits for Base L2
      expect(g1).to.be.lt(200_000n);
      expect(g2).to.be.lt(80_000n);
      expect(g3).to.be.lt(150_000n);
      expect(g4).to.be.lt(120_000n);
      expect(g5).to.be.lt(200_000n);
    });
  });
});
