/** NYSE cash-equity full closures and early closes.
 * Source: https://www.nyse.com/markets/hours-calendars
 * Cross-check: https://www.nyse.com/trade/hours-calendars
 * Verified 2026-09-17 against the published 2026–2028 holiday table.
 * Pre/post-market sessions are not modeled. Ad-hoc closures need an official notice.
 */
export const NYSE_SOURCE_URL = 'https://www.nyse.com/markets/hours-calendars';
export const NYSE_SOURCE_LABEL = 'NYSE Holidays & Trading Hours';
export const NYSE_VERIFIED_AT = '2026-09-17';
export const NYSE_TIME_ZONE = 'America/New_York';
export const TAIPEI_TIME_ZONE = 'Asia/Taipei';

export type NyseFullClose = {
  date: string;
  nameEn: string;
  nameZh: string;
  observed?: boolean;
};

export type NyseEarlyClose = {
  date: string;
  nameEn: string;
  nameZh: string;
  closeHour: number;
  closeMinute: number;
};

export const NYSE_FULL_CLOSES: Record<number, NyseFullClose[]> = {
  2026: [
    { date: '2026-01-01', nameEn: "New Year's Day", nameZh: '新年' },
    {
      date: '2026-01-19',
      nameEn: 'Martin Luther King, Jr. Day',
      nameZh: '馬丁·路德·金恩日',
    },
    {
      date: '2026-02-16',
      nameEn: "Washington's Birthday",
      nameZh: '華盛頓生日（總統日）',
    },
    { date: '2026-04-03', nameEn: 'Good Friday', nameZh: '耶穌受難日' },
    { date: '2026-05-25', nameEn: 'Memorial Day', nameZh: '陣亡將士紀念日' },
    {
      date: '2026-06-19',
      nameEn: 'Juneteenth National Independence Day',
      nameZh: '六月節',
    },
    {
      date: '2026-07-03',
      nameEn: 'Independence Day',
      nameZh: '獨立紀念日',
      observed: true,
    },
    { date: '2026-09-07', nameEn: 'Labor Day', nameZh: '勞動節' },
    { date: '2026-11-26', nameEn: 'Thanksgiving Day', nameZh: '感恩節' },
    { date: '2026-12-25', nameEn: 'Christmas Day', nameZh: '聖誕節' },
  ],
  2027: [
    { date: '2027-01-01', nameEn: "New Year's Day", nameZh: '新年' },
    {
      date: '2027-01-18',
      nameEn: 'Martin Luther King, Jr. Day',
      nameZh: '馬丁·路德·金恩日',
    },
    {
      date: '2027-02-15',
      nameEn: "Washington's Birthday",
      nameZh: '華盛頓生日（總統日）',
    },
    { date: '2027-03-26', nameEn: 'Good Friday', nameZh: '耶穌受難日' },
    { date: '2027-05-31', nameEn: 'Memorial Day', nameZh: '陣亡將士紀念日' },
    {
      date: '2027-06-18',
      nameEn: 'Juneteenth National Independence Day',
      nameZh: '六月節',
      observed: true,
    },
    {
      date: '2027-07-05',
      nameEn: 'Independence Day',
      nameZh: '獨立紀念日',
      observed: true,
    },
    { date: '2027-09-06', nameEn: 'Labor Day', nameZh: '勞動節' },
    { date: '2027-11-25', nameEn: 'Thanksgiving Day', nameZh: '感恩節' },
    {
      date: '2027-12-24',
      nameEn: 'Christmas Day',
      nameZh: '聖誕節',
      observed: true,
    },
  ],
  2028: [
    {
      date: '2028-01-17',
      nameEn: 'Martin Luther King, Jr. Day',
      nameZh: '馬丁·路德·金恩日',
    },
    {
      date: '2028-02-21',
      nameEn: "Washington's Birthday",
      nameZh: '華盛頓生日（總統日）',
    },
    { date: '2028-04-14', nameEn: 'Good Friday', nameZh: '耶穌受難日' },
    { date: '2028-05-29', nameEn: 'Memorial Day', nameZh: '陣亡將士紀念日' },
    {
      date: '2028-06-19',
      nameEn: 'Juneteenth National Independence Day',
      nameZh: '六月節',
    },
    { date: '2028-07-04', nameEn: 'Independence Day', nameZh: '獨立紀念日' },
    { date: '2028-09-04', nameEn: 'Labor Day', nameZh: '勞動節' },
    { date: '2028-11-23', nameEn: 'Thanksgiving Day', nameZh: '感恩節' },
    { date: '2028-12-25', nameEn: 'Christmas Day', nameZh: '聖誕節' },
  ],
};

export const NYSE_EARLY_CLOSES: Record<number, NyseEarlyClose[]> = {
  2026: [
    {
      date: '2026-11-27',
      nameEn: 'Day after Thanksgiving',
      nameZh: '感恩節翌日',
      closeHour: 13,
      closeMinute: 0,
    },
    {
      date: '2026-12-24',
      nameEn: 'Christmas Eve',
      nameZh: '聖誕夜',
      closeHour: 13,
      closeMinute: 0,
    },
  ],
  2027: [
    {
      date: '2027-11-26',
      nameEn: 'Day after Thanksgiving',
      nameZh: '感恩節翌日',
      closeHour: 13,
      closeMinute: 0,
    },
  ],
  2028: [
    {
      date: '2028-07-03',
      nameEn: 'Independence Day Eve',
      nameZh: '獨立紀念日前夕',
      closeHour: 13,
      closeMinute: 0,
    },
    {
      date: '2028-11-24',
      nameEn: 'Day after Thanksgiving',
      nameZh: '感恩節翌日',
      closeHour: 13,
      closeMinute: 0,
    },
  ],
};

export const NYSE_REGULAR_OPEN = { hour: 9, minute: 30 };
export const NYSE_REGULAR_CLOSE = { hour: 16, minute: 0 };
