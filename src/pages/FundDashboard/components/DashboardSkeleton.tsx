// src/pages/FundDashboard/components/DashboardSkeleton.tsx
import React from "react";

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex-1 h-full p-4 md:p-8 animate-pulse">
      {/* Header 骨架 */}
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-gray-100 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-gray-100 rounded-xl"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>

      {/* Summary Cards 骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100 p-6">
            <div className="h-4 w-24 bg-gray-100 rounded mb-4"></div>
            <div className="h-10 w-48 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Table 骨架 */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <div className="h-14 bg-gray-50/50 border-b border-gray-50"></div>
        <div className="p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-50 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
