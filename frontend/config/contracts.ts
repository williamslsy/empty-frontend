const productionContracts = {
  coinRegistry: "bbn1cersqqcxvuvzg8k5sradddufumn65xna6fcux7m6vp5n4fr6saqqw9450h",
  factory: "bbn1yjta8sjmff78udj2y7qztmvpdtw9ghwuv3tqu29p5aqx4mkyy06szj26h3",
  incentives: "bbn1y0rpf8d3ttl2rmtpn2avpkv24szsa524egjpyev97juuyggmmqzq8650z6",
  router: "bbn1qdc2lat5ymsy8yrm0s9ffx8cq34gjw3rg2g2fuktuq98ywqn3myscaxytn",
};

const testnetContracts = {
  coinRegistry: "bbn1cersqqcxvuvzg8k5sradddufumn65xna6fcux7m6vp5n4fr6saqqw9450h",
  factory: "bbn1yjta8sjmff78udj2y7qztmvpdtw9ghwuv3tqu29p5aqx4mkyy06szj26h3",
  incentives: "bbn1y0rpf8d3ttl2rmtpn2avpkv24szsa524egjpyev97juuyggmmqzq8650z6",
  router: "bbn1qdc2lat5ymsy8yrm0s9ffx8cq34gjw3rg2g2fuktuq98ywqn3myscaxytn",
};

export const contracts = process.env.NODE_ENV === "production" ? productionContracts : testnetContracts;
