import { NextPage } from "next";
import { Window as KeplrWindow, Keplr } from "@keplr-wallet/types";

declare global {
  interface Window {
    keplr?: Keplr;
    leap?: Keplr;
    cosmostation?: {
      providers: {
        keplr: Keplr;
      };
    };
  }
  namespace NodeJS {
    interface ProcessEnv {
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PW: string;
      SUPABASE_URL: string;
      SUPABASE_KEY: string;
    }
  }
}
