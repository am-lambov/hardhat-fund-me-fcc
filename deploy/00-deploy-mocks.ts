import { network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/dist/types"

const DECIMALS = "18"
const INITIAL_PRICE = "2000000000000000000000" // 2000

export const mocksDeploymentFunction: DeployFunction = async (
    hre: HardhatRuntimeEnvironment,
) => {
    console.log("Deploying FundMe")
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId: number = network.config.chainId!

    if (developmentChains.includes(network.name)) {
        console.log("Deploying Mocks...")
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        })
        log("Mocks Deployed!")
        log("----------------------------------")
        log(
            "You are deploying to a local network, you'll need a local network running to interact",
        )
        log(
            "Please run `yarn hardhat console` to interact with the deployed smart contracts!",
        )
        log("----------------------------------")
    }
}

export default mocksDeploymentFunction
mocksDeploymentFunction.tags = ["all", "mocks"]
