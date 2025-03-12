use cosmwasm_std::{
    Addr, Api, CanonicalAddr, RecoverPubkeyError, StdError, StdResult, VerificationError,
};

/// Length of canonical addresses created with this API. Contracts should not make any assumptions
/// what this value is.
///
/// The mock API can only canonicalize and humanize addresses up to this length. So it must be
/// long enough to store common bech32 addresses.
///
/// The value here must be restorable with `SHUFFLES_ENCODE` + `SHUFFLES_DECODE` in-shuffles.
/// See <https://oeis.org/A002326/list> for a table of those values.
const CANONICAL_LENGTH: usize = 90; // n = 45
const SHUFFLES_ENCODE: usize = 10;
const SHUFFLES_DECODE: usize = 2;

pub fn digit_sum(input: &[u8]) -> usize {
    input.iter().fold(0, |sum, val| sum + (*val as usize))
}

pub fn riffle_shuffle<T: Clone>(input: &[T]) -> Vec<T> {
    assert_eq!(
        input.len() % 2,
        0,
        "Method only defined for even number of elements"
    );
    let mid = input.len() / 2;
    let (left, right) = input.split_at(mid);
    let mut out = Vec::<T>::with_capacity(input.len());
    for i in 0..mid {
        out.push(right[i].clone());
        out.push(left[i].clone());
    }
    out
}

pub struct LegacyMockApi;

impl Api for LegacyMockApi {
    fn addr_validate(&self, input: &str) -> StdResult<Addr> {
        let canonical = self.addr_canonicalize(input)?;
        let normalized = self.addr_humanize(&canonical)?;
        if input != normalized.as_str() {
            return Err(StdError::generic_err(
                "Invalid input: address not normalized",
            ));
        }

        Ok(Addr::unchecked(input))
    }

    fn addr_canonicalize(&self, input: &str) -> StdResult<CanonicalAddr> {
        // Dummy input validation. This is more sophisticated for formats like bech32, where format and checksum are validated.
        let min_length = 3;
        let max_length = CANONICAL_LENGTH;
        if input.len() < min_length {
            return Err(StdError::generic_err(
                format!("Invalid input: human address too short for this mock implementation (must be >= {min_length})."),
            ));
        }
        if input.len() > max_length {
            return Err(StdError::generic_err(
                format!("Invalid input: human address too long for this mock implementation (must be <= {max_length})."),
            ));
        }

        // mimics formats like hex or bech32 where different casings are valid for one address
        let normalized = input.to_lowercase();

        let mut out = Vec::from(normalized);

        // pad to canonical length with NULL bytes
        out.resize(CANONICAL_LENGTH, 0x00);
        // content-dependent rotate followed by shuffle to destroy
        // the most obvious structure (https://github.com/CosmWasm/cosmwasm/issues/552)
        let rotate_by = digit_sum(&out) % CANONICAL_LENGTH;
        out.rotate_left(rotate_by);
        for _ in 0..SHUFFLES_ENCODE {
            out = riffle_shuffle(&out);
        }
        Ok(out.into())
    }

    fn addr_humanize(&self, canonical: &CanonicalAddr) -> StdResult<Addr> {
        if canonical.len() != CANONICAL_LENGTH {
            return Err(StdError::generic_err(
                "Invalid input: canonical address length not correct",
            ));
        }

        let mut tmp: Vec<u8> = canonical.clone().into();
        // Shuffle two more times which restored the original value (24 elements are back to original after 20 rounds)
        for _ in 0..SHUFFLES_DECODE {
            tmp = riffle_shuffle(&tmp);
        }
        // Rotate back
        let rotate_by = digit_sum(&tmp) % CANONICAL_LENGTH;
        tmp.rotate_right(rotate_by);
        // Remove NULL bytes (i.e. the padding)
        let trimmed = tmp.into_iter().filter(|&x| x != 0x00).collect();
        // decode UTF-8 bytes into string
        let human = String::from_utf8(trimmed)?;
        Ok(Addr::unchecked(human))
    }

    fn secp256k1_verify(
        &self,
        _message_hash: &[u8],
        _signature: &[u8],
        _public_key: &[u8],
    ) -> Result<bool, VerificationError> {
        unimplemented!()
    }

    fn secp256k1_recover_pubkey(
        &self,
        _message_hash: &[u8],
        _signature: &[u8],
        _recovery_param: u8,
    ) -> Result<Vec<u8>, RecoverPubkeyError> {
        unimplemented!()
    }

    fn ed25519_verify(
        &self,
        _message: &[u8],
        _signature: &[u8],
        _public_key: &[u8],
    ) -> Result<bool, VerificationError> {
        unimplemented!()
    }

    fn ed25519_batch_verify(
        &self,
        _messages: &[&[u8]],
        _signatures: &[&[u8]],
        _public_keys: &[&[u8]],
    ) -> Result<bool, VerificationError> {
        unimplemented!()
    }

    fn debug(&self, _message: &str) {
        unimplemented!()
    }
}
