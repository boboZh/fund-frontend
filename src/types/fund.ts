export interface FundItem {
  code: string;
  name: string;
  change?: string | number;
  amount: string | number;
  dailyProfit: string | number;
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
