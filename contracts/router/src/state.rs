use cosmwasm_schema::cw_serde;
use cosmwasm_std::Uint128;
use cw_storage_plus::Item;

use astroport::asset::AssetInfo;

pub const REPLY_DATA: Item<ReplyData> = Item::new("reply_data");

#[cw_serde]
pub struct ReplyData {
    pub asset_info: AssetInfo,
    pub prev_balance: Uint128,
    pub minimum_receive: Option<Uint128>,
    pub receiver: String,
}
