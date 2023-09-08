import { Deployment } from "hardhat-deploy/dist/types"
import { FundMe, MockV3Aggregator } from "../../typechain-types"
import { deployments, ethers } from "hardhat"
import { assert, expect } from "chai"
import {
    Signer,
    Transaction,
    TransactionLike,
    TransactionReceipt,
} from "ethers"

describe("FundMe", function () {
    let fundMe: FundMe
    let mockV3Aggregator: MockV3Aggregator
    let deployer: Signer
    const sendValue = ethers.parseEther("1") // 1 ETH

    this.beforeEach(async function () {
        await deployments.fixture("all")
        deployer = (await ethers.getSigners()).at(0) as Signer

        let fundMeDeployment: Deployment = await deployments.get("FundMe")
        let mockV3AggregatorDeployment: Deployment =
            await deployments.get("MockV3Aggregator")

        mockV3Aggregator = (await ethers.getContractAt(
            mockV3AggregatorDeployment.abi,
            mockV3AggregatorDeployment.address,
        )) as unknown as MockV3Aggregator

        fundMe = (await ethers.getContractAt(
            fundMeDeployment.abi,
            fundMeDeployment.address,
        )) as unknown as FundMe
    })

    describe("constructor", function () {
        it("Sets the aggregator addresses correctly", async function () {
            const response = await fundMe.priceFeed()
            assert.equal(response, await mockV3Aggregator.getAddress())
        })
    })

    describe("fund", function () {
        it("Fails if you don't send enough ETH", async function () {
            // await fundMe.fund()
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!",
            )
        })

        it("Updates correctly the addressToAmountFunded mapping", async function () {
            let funderAddress = await deployer.getAddress()
            let fundTransaction = await fundMe.fund({
                value: sendValue,
                from: funderAddress,
            })
            await fundTransaction.wait(1)

            let reportedFundedValue =
                await fundMe.addressToAmountFunded(funderAddress)

            assert.equal(sendValue, reportedFundedValue)
        })

        it("Adds funder's address to the funders array", async function () {
            let funderAddress = await deployer.getAddress()
            let fundTransaction = await fundMe.fund({
                value: sendValue,
                from: funderAddress,
            })
            await fundTransaction.wait(1)

            const response = await fundMe.funders(0)
            assert.equal(funderAddress, response)
        })
    })

    describe("withdraw", function () {
        let deployer: Signer
        let owner: Signer
        let firstFunder: Signer
        let secondFunder: Signer
        let accounts: Signer[]

        this.beforeEach(async function () {
            accounts = await ethers.getSigners()
            deployer = (await ethers.getSigners()).at(0) as Signer
            owner = deployer
            firstFunder = (await ethers.getSigners()).at(1) as Signer
            secondFunder = (await ethers.getSigners()).at(2) as Signer

            await fundMe.connect(accounts[1]).fund({
                value: sendValue,
                from: await firstFunder.getAddress(),
            })
        })

        it("Allows the owner to withdraw all the fundings", async function () {
            // Arange
            const startingDeployerBalance = await ethers.provider.getBalance(
                await owner.getAddress(),
            )

            const startingContractBallance = await ethers.provider.getBalance(
                await fundMe.getAddress(),
            )

            // Act
            const txResponse = await fundMe.withdraw({ from: owner })
            const txReceipt = await txResponse.wait(1)
            const gasUsed = txReceipt?.gasUsed!
            const effectiveGasPrice = txReceipt?.gasPrice!
            const gasCost = gasUsed * effectiveGasPrice

            // Assert
            const endingDeployerBalance: bigint =
                await ethers.provider.getBalance(await owner.getAddress())

            const endingContractBallance: bigint =
                await ethers.provider.getBalance(await fundMe.getAddress())

            const startingTotalBalance =
                startingContractBallance + startingDeployerBalance
            const endingTotalBalance = endingDeployerBalance + gasCost

            assert.equal(endingContractBallance, BigInt(0))
            assert.equal(startingTotalBalance, endingTotalBalance)
        })

        it("Blocks withdraws from non owner accounts", async function () {
            await expect(
                fundMe
                    .connect(accounts[1])
                    .withdraw({ from: await firstFunder.getAddress() }),
            ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
        })

        it("Empties the funders array", async function () {
            await fundMe.connect(accounts[2]).fund({
                value: sendValue,
                from: await secondFunder.getAddress(),
            })
            await fundMe.withdraw({ from: await deployer.getAddress() })

            await expect(fundMe.funders(0)).to.be.reverted
        })

        it("Resets the addressToAmountFunded mapping to 0", async function () {
            await fundMe.connect(accounts[2]).fund({
                value: sendValue,
                from: await secondFunder.getAddress(),
            })
            await fundMe.withdraw({ from: await deployer.getAddress() })

            const secondFunderAmount = await fundMe.addressToAmountFunded(
                await secondFunder.getAddress(),
            )
            assert.equal(secondFunderAmount, BigInt(0))
        })
    })

    describe("receive", function () {
        it("Calls the fund() function when received() is called", async function () {
            const transaction = {
                value: sendValue,
                from: await deployer.getAddress(),
                to: await fundMe.getAddress(),
            }

            await deployer.sendTransaction(transaction)

            assert.equal(
                await ethers.provider.getBalance(await fundMe.getAddress()),
                sendValue,
            )
        })
    })

    describe("fallback", function () {
        it("Calls the fund() function when fallback() is triggered", async function () {
            const transaction: TransactionLike = {
                value: sendValue,
                from: await deployer.getAddress(),
                to: await fundMe.getAddress(),
                data: ethers.encodeBytes32String("Fallback-Trigger"),
            }

            await deployer.sendTransaction(transaction)

            assert.equal(
                await ethers.provider.getBalance(await fundMe.getAddress()),
                sendValue,
            )
        })
    })

    describe("getVersion", function () {
        it("returns the same version as the v3Aggregator price feed version", async function () {
            const fundMePricefeedVersion = await fundMe.getVersion()
            const mockV3AggregatorVersion = await mockV3Aggregator.version()

            assert.equal(fundMePricefeedVersion, mockV3AggregatorVersion)
        })
    })
})
