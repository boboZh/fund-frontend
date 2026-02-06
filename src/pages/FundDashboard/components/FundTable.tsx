import React from "react";
import type { FundItem } from "@/types/fund";

export interface Column<T> {
  name: string;
  key: keyof T | "op";
  colClassName: string | ((val: any) => string);
}

export interface FundTableProps<T> {
  columns: Column<T>[];
  funds: T[];
  handleDelete: (fund: T) => void;
}

const FundTable: React.FC<FundTableProps<FundItem>> = ({ columns, funds, handleDelete }) => {
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
              <tr key={fund.code} className="hover:bg-gray-50/80 transition-colors">
                {columns.map((item, index) => {
                  if (item.key === "op")
                    return (
                      <td
                        key={item.key}
                        className="px-8 py-5 text-right cursor-pointer text-nowrap"
                        onClick={() => handleDelete(fund)}
                      >
                        删除
                      </td>
                    );

                  const value = fund[item.key as keyof FundItem];
                  const className =
                    typeof item.colClassName === "function"
                      ? item.colClassName(fund)
                      : item.colClassName;

                  return (
                    <td
                      key={item.key}
                      className={`px-8 py-5 font-bold ${index > 0 ? "text-right" : ""} ${className}`}
                    >
                      {value}
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
