import { Deployment } from "hardhat-deploy/dist/types"
import { FundMe } from "../typechain-types"
import { deployments, ethers, network } from "hardhat"
import { Signer } from "ethers"

async function main() {
    let deployer: Signer
    let fundMe: FundMe
    let fundMeDeployment: Deployment = await deployments.get("FundMe")

    deployer = (await ethers.getSigners()).at(0) as Signer
    fundMe = (await ethers.getContractAt(
        fundMeDeployment.abi,
        fundMeDeployment.address,
    )) as unknown as FundMe

    const contractBalance = await ethers.provider.getBalance(
        await fundMe.getAddress(),
    )

    const withdrawingTransaction = await fundMe.withdraw({
        from: await deployer.getAddress(),
    })

    await withdrawingTransaction.wait(1)
    console.log(
        `Withdrew ${contractBalance} from\nContract: ${await fundMe.getAddress()}\nOn the ${
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
