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
    // 容器必须有 relative 和 overflow-x-auto 才能让 sticky 生效
    <div className="overflow-x-auto relative w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-gray-400 text-xs uppercase tracking-wider whitespace-nowrap bg-gray-50/50">
            {columns.map((item, index) => {
              const isFirstCol = index === 0;
              const isLastCol = index === columns.length - 1;

              return (
                <th
                  key={item.name}
                  className={`px-4 md:px-6 py-4 font-semibold ${index > 0 ? "text-right" : ""}
                    ${isFirstCol ? "sticky left-0 z-20 bg-gray-50 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)]" : ""}
                    ${isLastCol ? "sticky right-0 z-20 bg-gray-50 shadow-[-2px_0_10px_-4px_rgba(0,0,0,0.05)]" : ""}
                  `}
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
              <tr
                key={fund.fundCode}
                className="group hover:bg-gray-50/80 transition-colors bg-white"
              >
                {columns.map((item, colIndex) => {
                  let content: React.ReactNode;

                  if (item.render) {
                    content = typeof item.render === "function" ? item.render(fund) : item.render;
                  } else {
                    content = String(fund[item.key as keyof FundItem] ?? "");
                  }

                  const isRightAligned = colIndex > 0;
                  const isFirstCol = colIndex === 0;
                  const isLastCol = colIndex === columns.length - 1;

                  const dynamicClass =
                    typeof item.colClassName === "function"
                      ? item.colClassName(fund)
                      : item.colClassName || "";

                  return (
                    <td
                      key={item.key}
                      className={`px-4 md:px-6 py-4 font-bold ${isRightAligned ? "text-right" : ""} ${dynamicClass}
                        ${isFirstCol ? "sticky left-0 z-10 bg-white group-hover:bg-gray-50 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)] transition-colors" : ""}
                        ${isLastCol ? "sticky right-0 z-10 bg-white group-hover:bg-gray-50 shadow-[-2px_0_10px_-4px_rgba(0,0,0,0.05)] transition-colors" : ""}
                      `}
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
