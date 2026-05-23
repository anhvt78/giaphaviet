export const LUKSO_CHAIN_ID = "0x2A";
export const LUKSO_RPC_URL = "https://rpc.mainnet.lukso.network";
export const LUKSO_CHAIN_NAME = "LUKSO Mainnet";
export const LUKSO_SYMBOL = "LYX";
export const LUKSO_EXPLORER =
  "https://explorer.execution.mainnet.lukso.network";
export const NETWORK = {
  chainId: LUKSO_CHAIN_ID,
  rpcUrls: [LUKSO_RPC_URL],
  chainName: LUKSO_CHAIN_NAME,
  nativeCurrency: {
    name: "LYX",
    symbol: LUKSO_SYMBOL,
    decimals: 18,
  },
  blockExplorerUrls: [LUKSO_EXPLORER],
};

export const quickLinksData = [
  { title: "About us", href: "/about" },
  { title: "Contact us", href: "/contact" },
  { title: "Terms & Conditions", href: "/terms" },
  { title: "Privacy Policy", href: "/privacy" },
  { title: "FAQs", href: "/faqs" },
];
