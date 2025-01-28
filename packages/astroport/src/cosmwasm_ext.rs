use cosmwasm_std::{
    ConversionOverflowError, Decimal, Decimal256, Fraction, StdError, Uint128, Uint256,
};

pub trait IntegerToDecimal
where
    Self: Copy + Into<Uint128> + Into<Uint256>,
{
    fn to_decimal(self) -> Decimal {
        Decimal::from_ratio(self, 1u8)
    }

    fn to_decimal256(self, precision: impl Into<u32>) -> Decimal256 {
        Decimal256::from_ratio(self, 10u128.pow(precision.into()))
    }
}

impl IntegerToDecimal for u64 {}
impl IntegerToDecimal for Uint128 {}

pub trait DecimalToInteger<T> {
    fn to_uint(self, precision: impl Into<u32>) -> Result<T, ConversionOverflowError>;
}

impl DecimalToInteger<Uint128> for Decimal256 {
    fn to_uint(self, precision: impl Into<u32>) -> Result<Uint128, ConversionOverflowError> {
        let multiplier = Uint256::from(10u8).pow(precision.into());
        (multiplier * self.numerator() / self.denominator()).try_into()
    }
}

pub trait ConvertInto<T>
where
    Self: Sized,
{
    type Error: Into<StdError>;
    fn conv(self) -> Result<T, Self::Error>;
}

impl ConvertInto<Decimal> for Decimal256 {
    type Error = StdError;

    fn conv(self) -> Result<Decimal, Self::Error> {
        let numerator: Uint128 = self.numerator().try_into()?;
        Decimal::from_atomics(numerator, self.decimal_places())
            .map_err(|err| StdError::generic_err(err.to_string()))
    }
}

pub trait DecMul<T> {
    fn dec_mul(self, rhs: T) -> Self;
}

impl DecMul<Decimal> for Uint128 {
    fn dec_mul(self, rhs: Decimal) -> Self {
        self * rhs.numerator() / rhs.denominator()
    }
}

impl DecMul<Decimal256> for Uint256 {
    fn dec_mul(self, rhs: Decimal256) -> Self {
        self * rhs.numerator() / rhs.denominator()
    }
}
