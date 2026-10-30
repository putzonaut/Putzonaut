import type {TemplateCategory} from './setup.ts';

export const STATISTIC_RANGES=[7,30,90] as const;
export type StatisticRange=typeof STATISTIC_RANGES[number];
export type StatisticCategory=TemplateCategory|'unknown';
export type StatisticBucket={at:string;category:string|null;icon:string|null;room:string|null;title:string|null;count:number;xp:number;stars:number};
export type StatisticPoint={from:string;to:string;count:number;xp:number;stars:number};
export type Statistics={
 householdId:string;profileId:string;restoreEpoch:string;revision:number;generatedAt:string;
 period:{days:StatisticRange;from:string;to:string};
 totals:{count:number;xp:number;stars:number;activeDays:number};
 activity:{unit:'day'|'week'|'month';points:StatisticPoint[]};
 categories:{id:StatisticCategory;count:number}[];
 goals:{from:string;to:string;count:number;goal:number|null;current:boolean}[];
};
export const STATISTIC_COLORS:Record<StatisticCategory,string>={kitchen:'#72e5d5',bath:'#81bdf8',laundry:'#b7a0ff',tidy:'#ffd76b',household:'#ffb083',plants:'#9cdb8b',pets:'#f5a8cf',unknown:'#98a8c7'};
