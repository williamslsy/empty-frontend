use cosmwasm_schema::cw_serde;
use cosmwasm_std::Uint128;

/// This structure describes the execute messages available in the contract.
#[cw_serde]
pub enum ExecuteMsg {
    /// Claim claims vested tokens and sends them to a recipient
    Claim {
        /// The address that receives the vested tokens
        recipient: Option<String>,
        /// The amount of tokens to claim
        amount: Option<Uint128>,
    },
}
