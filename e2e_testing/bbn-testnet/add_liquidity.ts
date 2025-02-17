import deployed from "./deployed.json";
import config from "../config.json";
import {AstroportFactoryClient} from "../sdk/AstroportFactory.client";
import {getClientAndAddress} from "../lib";
import {AstroportIncentivesClient} from "../sdk/AstroportIncentives.client";
import { AstroportPairConcentratedClient } from "../sdk/AstroportPairConcentrated.client";
import { Asset, AssetInfo } from "../sdk/AstroportPairConcentrated.types";
import { Coin, coin } from "@cosmjs/proto-signing";


interface PoolInfo {
    contractAddr: string;
    liquidityToken: string;
}

async function findPoolByTokens(
    factoryClient: AstroportFactoryClient,
    denom1: string,
    denom2: string
): Promise<PoolInfo | undefined> {
    const pairs = await factoryClient.pairs({});
    
    for (const pair of pairs) {
        const assets = pair.asset_infos;
        const isMatch = assets.every(asset => {
            if ('native_token' in asset) {
                return asset.native_token.denom === denom1 || 
                       asset.native_token.denom === denom2;
            }
            return false;
        });
        
        if (isMatch && assets.length === 2) {
            return {
                contractAddr: pair.contract_addr,
                liquidityToken: pair.liquidity_token
            };
        }
    }
    
    return undefined;
}

const main = async () => {
    const {client, address} = await getClientAndAddress();
    
    const token0 = "ibc/2278567FFA6D754BDD8C159CE1770D8AF27649BFB58E5132CF530460591E479D";
    const token1 = "ibc/241F1FFE4117C31D7DFC2A91C026F083FCEB6868C169BA5002FF0B3E17B88EDF";

    const factoryClient = new AstroportFactoryClient(client, address, deployed.factory);
    const poolInfo = await findPoolByTokens(factoryClient, token0, token1);

    console.log(poolInfo);

    if (poolInfo) {
        const poolClient = new AstroportPairConcentratedClient(client, address, poolInfo.contractAddr)

        const assets = [
            {
                info: {
                    native_token: {
                        denom: token0
                    }
                },
                amount: "1000000000000000000000"
            },
            {
                info: {
                    native_token: {
                        denom: token1
                    }
                },
                amount: "1000000000"
            }
        ];
        const coins: Coin[] = assets.map((asset => { return coin(asset.amount, asset.info.native_token.denom)}));
        
        const response = await poolClient.provideLiquidity(
            {assets, autoStake: true},
            "auto",
            undefined,
            coins
        );
        console.log("Provide liquidity response:", response);
    } else {
        console.error("Pool not found for the given tokens.");
    }
}

main();