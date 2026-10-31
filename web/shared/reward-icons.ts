// Shared by the picker, stored wishes and backup validation. Keep legacy IDs stable.
export const REWARD_ICON_IDS=['gift','film','ice','meal','pizza','cake','coffee','cookie','gamepad','boardgame','book','music','mic','palette','puzzle','ticket','swim','bike','trees','tent','trip','wellness','heart','shopping'] as const;
export type RewardIconId=typeof REWARD_ICON_IDS[number];
export const REWARD_ICON_LABELS:Record<RewardIconId,string>={
 gift:'Geschenk',film:'Filmabend',ice:'Eis',meal:'Essen',pizza:'Pizza',cake:'Kuchen',coffee:'Kaffee',cookie:'Kekse',
 gamepad:'Gaming',boardgame:'Spieleabend',book:'Lesen',music:'Musik',mic:'Karaoke',palette:'Kreativzeit',puzzle:'Puzzle',ticket:'Event',
 swim:'Schwimmen',bike:'Radfahren',trees:'Natur',tent:'Camping',trip:'Ausflug',wellness:'Wellness',heart:'Zeit zu zweit',shopping:'Shoppen',
};
