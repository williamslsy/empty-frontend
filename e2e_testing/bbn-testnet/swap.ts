import deployed from "./deployed.json";
import tokens from "./tokens.json"; // Assuming this file contains token decimal information
import { AstroportRouterClient } from "../sdk/AstroportRouter.client";
import { AstroportFactoryClient } from "../sdk/AstroportFactory.client";
import { getClientAndAddress } from "../lib";
import { Coin, coin } from "@cosmjs/proto-signing";
import { SwapOperation } from "../sdk/AstroportRouter.types";

async function findPairAddress(factoryClient: AstroportFactoryClient, denom1: string, denom2: string): Promise<string | undefined> {
    const pairs = await factoryClient.pairs({});
    for (const pair of pairs) {
        const assets = pair.asset_infos;
        const isMatch = assets.every(asset => {
            if ('native_token' in asset) {
                return asset.native_token.denom === denom1 || asset.native_token.denom === denom2;
            }
            return false;
        });

        if (isMatch && assets.length === 2) {
            return pair.contract_addr;
        }
    }
    return undefined;
}

function getTokenDecimals(denom: string): number {
    const token = tokens.tokens.find(t => t.denom === denom);
    return token ? token.decimals : 0;
}

function adjustAmount(amount: string, decimals: number): string {
    return (BigInt(amount) * BigInt(10 ** decimals)).toString();
}

const main = async () => {
    const { client, address } = await getClientAndAddress();

    const routerAddress = deployed.router;
    const baseOfferAmount = "10";
    // insane slippage because test pools
    const baseMinimumReceive = "5";

    const token0 = "ibc/2278567FFA6D754BDD8C159CE1770D8AF27649BFB58E5132CF530460591E479D";
    const token1 = "ibc/241F1FFE4117C31D7DFC2A91C026F083FCEB6868C169BA5002FF0B3E17B88EDF";

    const decimals0 = getTokenDecimals(token0);
    const decimals1 = getTokenDecimals(token1);

    const offerAmount = adjustAmount(baseOfferAmount, decimals0);
    const minimumReceive = adjustAmount(baseMinimumReceive, decimals1);

    const factoryClient = new AstroportFactoryClient(client, address, deployed.factory);
    const pairAddress = await findPairAddress(factoryClient, token0, token1);

    if (!pairAddress) {
        console.error("Pair not found for the given token denoms.");
        return;
    }

    const swapOperation = {
        offer_asset_info: {
            native_token: {
                denom: token0
            }
        },
        ask_asset_info: {
            native_token: {
                denom: token1
            }
        },
        pair_address: pairAddress
    };

    const routerClient = new AstroportRouterClient(client, address, routerAddress);

    try {
        const response = await routerClient.executeSwapOperations(
            {
                maxSpread: "0.1",
                minimumReceive,
                operations: [swapOperation],
                to: address
            },
            "auto",
            undefined,
            [coin(offerAmount, swapOperation.offer_asset_info.native_token.denom)]
        );

        console.log("Swap transaction successful:", response.transactionHash);
    } catch (error) {
        console.error("Swap transaction failed:", error);
    }
}

main().catch(console.error);
