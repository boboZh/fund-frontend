export interface FundItem {
  fundCode: string;
  fundName: string;
  change?: string | number;
  amount: string | number;
  dailyProfit?: string | number;
  targetProfitRate?: string | number | null;
  stopLossRate?: string | number | null;
}

export interface PortfolioData {
  summary: {
    totalAmount: string | number;
    totalDailyProfit: string | number;
  };
  funds: FundItem[];
}
