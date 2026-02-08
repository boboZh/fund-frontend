import React from "react";
import type { FundItem } from "@/types/fund";

export interface Column<T> {
  name: string;
  key: keyof T | "op";
  colClassName?: string | ((val: T) => string);
  render?: React.ReactNode | ((val: T) => React.ReactNode);
}

export interface FundTableProps<T> {
  columns: Column<T>[];
  funds: T[];
}

const FundTable: React.FC<FundTableProps<FundItem>> = ({ columns, funds }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-gray-400 text-xs uppercase tracking-wider text-nowrap">
            {columns.map((item, index) => {
              return (
                <th
                  key={item.name}
                  className={`px-8 py-4 font-semibold ${index > 0 ? "text-right" : ""}`}
                >
                  {item.name}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {funds.map((fund) => {
            return (
              <tr key={fund.fundCode} className="hover:bg-gray-50/80 transition-colors">
                {columns.map((item, colIndex) => {
                  let content: React.ReactNode;

                  if (item.render) {
                    content = typeof item.render === "function" ? item.render(fund) : item.render;
                  } else {
                    content = String(fund[item.key as keyof FundItem] ?? "");
                  }

                  const isRightAligned = colIndex > 0;
                  const dynamicClass =
                    typeof item.colClassName === "function"
                      ? item.colClassName(fund)
                      : item.colClassName || "";

                  return (
                    <td
                      key={item.key}
                      className={`px-8 py-5 font-bold ${isRightAligned ? "text-right" : ""} ${dynamicClass}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FundTable;
