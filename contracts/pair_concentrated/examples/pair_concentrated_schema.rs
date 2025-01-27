use cosmwasm_schema::write_api;

use astroport::pair::{ExecuteMsg, InstantiateMsg};
use astroport::pair_concentrated::QueryMsg;

fn main() {
    write_api! {
        instantiate: InstantiateMsg,
        query: QueryMsg,
        execute: ExecuteMsg,
    }
}
