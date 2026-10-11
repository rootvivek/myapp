import type { KhataParty } from '../types';

export type KhataParamList = {
  KhataHome: undefined;
  PartyDetail: { partyId: string };
  AddTransaction: { partyId: string; partyName: string };
  AddParty: undefined;
  SharedKhata: undefined;
};

export function getPartyRouteParam(party: KhataParty): string {
  return party.id;
}
