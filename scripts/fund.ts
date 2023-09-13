import { Deployment } from "hardhat-deploy/dist/types"
import { FundMe } from "../typechain-types"
import { deployments, ethers, network } from "hardhat"
import { Signer } from "ethers"

async function main() {
    let deployer: Signer
    let fundMe: FundMe
    const sendValue = ethers.parseEther("0.001")
    let fundMeDeployment: Deployment = await deployments.get("FundMe")

    deployer = (await ethers.getSigners()).at(0) as Signer
    fundMe = (await ethers.getContractAt(
        fundMeDeployment.abi,
        fundMeDeployment.address,
    )) as unknown as FundMe

    const fundingTransaction = await fundMe.fund({
        value: sendValue,
        from: await deployer.getAddress(),
    })

    await fundingTransaction.wait(1)
    console.log(
        `Funded ${sendValue} to\nContract: ${await fundMe.getAddress()}\nOn the ${
            network.name
        } network.`,
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
