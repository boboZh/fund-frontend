export interface FundItem {
  code: string;
  name: string;
  change?: string | number;
  amount: string | number;
  dailyProfit?: string | number;
  targetProfitRate?: string | number | null;
  stopLossRate?: string | number | null;
}

export interface PortfolioData {
  summary: {
    totalValue: string | number;
    totalDailyProfit: string | number;
  };
  funds: FundItem[];
}

export interface AddFundItem {
  code: string;
  name: string;
  amount: string | number;
}
