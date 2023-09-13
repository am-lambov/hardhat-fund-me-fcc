import { Deployment } from "hardhat-deploy/dist/types"
import { FundMe, MockV3Aggregator } from "../../typechain-types"
import { deployments, ethers, network } from "hardhat"
import { assert, expect } from "chai"
import { Signer, TransactionLike } from "ethers"
import { developmentChains } from "../../helper-hardhat-config"

console.log(network.name)

if (!developmentChains.includes(network.name)) {
    describe("FundMe Staging Tests", async function () {
        let fundMe: FundMe
        let deployer: Signer
        const sendValue = ethers.parseEther("0.001")

        beforeEach(async function () {
            let fundMeDeployment: Deployment = await deployments.get("FundMe")

            deployer = (await ethers.getSigners()).at(0) as Signer
            fundMe = (await ethers.getContractAt(
                fundMeDeployment.abi,
                fundMeDeployment.address,
            )) as unknown as FundMe
        })

        it("Allows people to fund and withdraw", async function () {
            const fundingTransaction = await fundMe.fund({ value: sendValue })
            await fundingTransaction.wait(1)
            const withdrawingTransaction = await fundMe.withdraw({
                gasLimit: 100000,
            })
            await withdrawingTransaction.wait(1)
            const endingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress(),
            )
            console.log(
                endingFundMeBalance.toString() +
                    " should equal 0, running assert equal...",
            )
            assert.equal(endingFundMeBalance.toString(), "0")
        })
    })
} else {
    console.log("Not testchain")
}

// developmentChains.includes(network.name)
//     ? describe.skip
//     : describe("FundMe Staging Tests", async function () {
//           let fundMe: FundMe
//           let deployer: Signer
//           let fundMeDeployment: Deployment = await deployments.get("FundMe")
//           const sendValue = ethers.parseEther("0.001")

//           beforeEach(async function () {
//               deployer = (await ethers.getSigners()).at(0) as Signer
//               fundMe = (await ethers.getContractAt(
//                   fundMeDeployment.abi,
//                   fundMeDeployment.address,
//               )) as unknown as FundMe
//           })

//           it("Allows people to fund and withdraw", async function () {
//               const fundingTransaction = await fundMe.fund({ value: sendValue })
//               await fundingTransaction.wait(1)
//               const withdrawingTransaction = await fundMe.withdraw({
//                   gasLimit: 100000,
//               })
//               await withdrawingTransaction.wait(1)
//               const endingFundMeBalance = await ethers.provider.getBalance(
//                   await fundMe.getAddress(),
//               )
//               console.log(
//                   endingFundMeBalance.toString() +
//                       " should equal 0, running assert equal...",
//               )
//               assert.equal(endingFundMeBalance.toString(), "0")
//           })
//       })
