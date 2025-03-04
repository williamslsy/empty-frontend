import { useContext } from "react";
import { Config, ConfigParameter } from "~/types/config";
import { Web3Context } from "~/app/providers/Web3Provider";

export type UseConfigParameters<config extends Config = Config> = ConfigParameter<config>;

export type UseConfigReturnType<config extends Config = Config> = config;

export function useConfig<config extends Config>(parameters: UseConfigParameters = {}): UseConfigReturnType<config> {
  const config = parameters.config ?? useContext(Web3Context);
  if (!config) throw new Error("useConfig must be used within a Web3Provider");
  return config as UseConfigReturnType<config>;
}
