import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {SigningCosmWasmClient} from "@cosmjs/cosmwasm-stargate";
import {GasPrice} from "@cosmjs/stargate";
import {stringToPath} from "@cosmjs/crypto";

const rpcEndpoint = "http://localhost:26657/";
const mnemonic = "bachelor sell sell excuse crop mansion embark finger level empty forum sad brain hazard stay morning tonight drip apology energy country any video kick";
const gasPrice = GasPrice.fromString("0.0025uluna");
const prefix = "terra"
const hdPaths = [stringToPath("m/44'/330'/0'/0/0")]

export const getClientAndAddress = async () => {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix,
        hdPaths,
    });
    const [account] = await wallet.getAccounts();

    return SigningCosmWasmClient.connectWithSigner(rpcEndpoint, wallet, {
        gasPrice
    }).then((client) => {
        return {client, address: account.address};
    });
}