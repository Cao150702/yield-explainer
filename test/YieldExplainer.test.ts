// Test for YieldExplainer contract
// Run: npx hardhat test test/YieldExplainer.test.ts

import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'

describe('YieldExplainer', function () {
  // Fixture: deploy contract once, reuse for all tests
  async function deployFixture() {
    const [owner, analyst1, analyst2, verifier] = await ethers.getSigners()

    const YieldExplainer = await ethers.getContractFactory('YieldExplainer')
    const explainer = await YieldExplainer.deploy()

    return { explainer, owner, analyst1, analyst2, verifier }
  }

  describe('Deployment', function () {
    it('Should set the deployer as owner', async function () {
      const { explainer, owner } = await loadFixture(deployFixture)
      expect(await explainer.owner()).to.equal(owner.address)
    })

    it('Should set the deployer as a verifier', async function () {
      const { explainer, owner } = await loadFixture(deployFixture)
      expect(await explainer.verifiers(owner.address)).to.be.true
    })

    it('Should start with no records', async function () {
      const { explainer, owner } = await loadFixture(deployFixture)
      const record = await explainer.records(owner.address)
      expect(record.strategy).to.equal(ethers.ZeroAddress)
    })
  })

  describe('submitExplanation', function () {
    it('Should store explanation hash correctly', async function () {
      const { explainer, analyst1 } = await loadFixture(deployFixture)
      const strategy = analyst1.address
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes('test explanation'))

      await explainer.connect(analyst1).submitExplanation(strategy, contentHash, 45)

      const record = await explainer.records(strategy)
      expect(record.contentHash).to.equal(contentHash)
      expect(record.riskScore).to.equal(45)
      expect(record.analyst).to.equal(analyst1.address)
      expect(record.verified).to.be.false
    })

    it('Should add analyst to contributors list', async function () {
      const { explainer, analyst1 } = await loadFixture(deployFixture)
      const strategy = analyst1.address
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes('test'))

      await explainer.connect(analyst1).submitExplanation(strategy, contentHash, 30)

      const contributors = await explainer.contributors(strategy)
      expect(contributors).to.include(analyst1.address)
      expect(contributors.length).to.equal(1)
    })

    it('Should reject zero address for strategy', async function () {
      const { explainer, analyst1 } = await loadFixture(deployFixture)
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes('test'))

      await expect(
        explainer.connect(analyst1).submitExplanation(ethers.ZeroAddress, contentHash, 50)
      ).to.be.revertedWith('Invalid strategy')
    })

    it('Should reject risk score > 100', async function () {
      const { explainer, analyst1 } = await loadFixture(deployFixture)
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes('test'))

      await expect(
        explainer.connect(analyst1).submitExplanation(analyst1.address, contentHash, 101)
      ).to.be.revertedWith('Risk score must be 0-100')
    })

    it('Should reject zero hash', async function () {
      const { explainer, analyst1 } = await loadFixture(deployFixture)

      await expect(
        explainer.connect(analyst1).submitExplanation(analyst1.address, ethers.ZeroHash, 50)
      ).to.be.revertedWith('Invalid hash')
    })

    it('Should emit ExplanationSubmitted event', async function () {
      const { explainer, analyst1 } = await loadFixture(deployFixture)
      const strategy = analyst1.address
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes('test'))

      await expect(explainer.connect(analyst1).submitExplanation(strategy, contentHash, 55))
        .to.emit(explainer, 'ExplanationSubmitted')
        .withArgs(strategy, analyst1.address, contentHash, 55)
    })
  })

  describe('verifyExplanation', function () {
    it('Should allow verifier to mark as verified', async function () {
      const { explainer, analyst1, owner } = await loadFixture(deployFixture)
      const strategy = analyst1.address
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes('test'))

      await explainer.connect(analyst1).submitExplanation(strategy, contentHash, 30)
      await explainer.connect(owner).verifyExplanation(strategy)

      const record = await explainer.records(strategy)
      expect(record.verified).to.be.true
    })

    it('Should reject non-verifier', async function () {
      const { explainer, analyst1, analyst2 } = await loadFixture(deployFixture)
      const strategy = analyst1.address
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes('test'))

      await explainer.connect(analyst1).submitExplanation(strategy, contentHash, 30)

      await expect(
        explainer.connect(analyst2).verifyExplanation(strategy)
      ).to.be.revertedWith('Not verifier')
    })

    it('Should reject verifying non-existent record', async function () {
      const { explainer, owner } = await loadFixture(deployFixture)

      await expect(
        explainer.connect(owner).verifyExplanation(ethers.ZeroAddress)
      ).to.be.revertedWith('No record')
    })
  })

  describe('verifyHash', function () {
    it('Should return true for matching hash', async function () {
      const { explainer, analyst1 } = await loadFixture(deployFixture)
      const strategy = analyst1.address
      const explanation = 'This strategy deposits USDC into Aave V3 for lending yield.'
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes(explanation))

      await explainer.connect(analyst1).submitExplanation(strategy, contentHash, 25)

      const isValid = await explainer.verifyHash.staticCall(strategy, explanation)
      expect(isValid).to.be.true
    })

    it('Should return false for non-matching hash', async function () {
      const { explainer, analyst1 } = await loadFixture(deployFixture)
      const strategy = analyst1.address
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes('original'))

      await explainer.connect(analyst1).submitExplanation(strategy, contentHash, 25)

      const isValid = await explainer.verifyHash.staticCall(strategy, 'tampered')
      expect(isValid).to.be.false
    })
  })

  describe('Verifier management', function () {
    it('Should allow owner to add verifier', async function () {
      const { explainer, owner, verifier } = await loadFixture(deployFixture)

      await explainer.connect(owner).addVerifier(verifier.address)
      expect(await explainer.verifiers(verifier.address)).to.be.true
    })

    it('Should allow owner to remove verifier', async function () {
      const { explainer, owner, verifier } = await loadFixture(deployFixture)

      await explainer.connect(owner).addVerifier(verifier.address)
      await explainer.connect(owner).removeVerifier(verifier.address)
      expect(await explainer.verifiers(verifier.address)).to.be.false
    })

    it('Should reject non-owner adding verifier', async function () {
      const { explainer, analyst1, verifier } = await loadFixture(deployFixture)

      await expect(
        explainer.connect(analyst1).addVerifier(verifier.address)
      ).to.be.revertedWith('Not owner')
    })
  })
})
