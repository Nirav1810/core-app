// src/navigation/types.ts
export type MainStackParamList = {
  Ledger: undefined;
  NewDeal: { selectedClientId?: string; selectedClientName?: string } | undefined;
  PartyList: undefined;
  DealDetail: { dealId: string };
};
