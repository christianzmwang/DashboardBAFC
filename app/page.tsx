'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import { filterDataByDateRange, getAvailableMonths, MonthlyRevenue, MonthlyMembership, filterMembershipDataByDateRange, getAvailableMembershipMonths, MonthlyAmountBreakdown, filterAmountBreakdownByDateRange } from '../lib/clientUtils';
import { RevenueChart } from '../components/RevenueChart';
import { LocationChart } from '../components/LocationChart';
import { MembershipChart } from '../components/MembershipChart';
import { LocationMembershipChart } from '../components/LocationMembershipChart';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { RevenueAmountBreakdownChart, computeAmountLegendKeys, amountLegendPalette } from '../components/RevenueAmountBreakdownChart';

interface LocationDataResponse {
  allData: MonthlyRevenue[];
  losGatosData: MonthlyRevenue[];
  pleasantonData: MonthlyRevenue[];
}

interface MembershipDataResponse {
  allData: MonthlyMembership[];
  losGatosData: MonthlyMembership[];
  pleasantonData: MonthlyMembership[];
}

interface LocationDataResponse {
  allData: MonthlyRevenue[];
  losGatosData: MonthlyRevenue[];
  pleasantonData: MonthlyRevenue[];
}

export default function Page() {
  const [allData, setAllData] = useState<MonthlyRevenue[]>([]);
  const [losGatosData, setLosGatosData] = useState<MonthlyRevenue[]>([]);
  const [pleasantonData, setPleasantonData] = useState<MonthlyRevenue[]>([]);
  const [filteredAllData, setFilteredAllData] = useState<MonthlyRevenue[]>([]);
  const [filteredLosGatosData, setFilteredLosGatosData] = useState<MonthlyRevenue[]>([]);
  const [filteredPleasantonData, setFilteredPleasantonData] = useState<MonthlyRevenue[]>([]);
  
  // Membership data states
  const [allMembershipData, setAllMembershipData] = useState<MonthlyMembership[]>([]);
  const [losGatosMembershipData, setLosGatosMembershipData] = useState<MonthlyMembership[]>([]);
  const [pleasantonMembershipData, setPleasantonMembershipData] = useState<MonthlyMembership[]>([]);
  const [filteredAllMembershipData, setFilteredAllMembershipData] = useState<MonthlyMembership[]>([]);
  const [filteredLosGatosMembershipData, setFilteredLosGatosMembershipData] = useState<MonthlyMembership[]>([]);
  const [filteredPleasantonMembershipData, setFilteredPleasantonMembershipData] = useState<MonthlyMembership[]>([]);
  
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Amount breakdown state
  const [amountBreakdown, setAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [filteredAmountBreakdown, setFilteredAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [lgAmountBreakdown, setLgAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [plAmountBreakdown, setPlAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [filteredLgAmountBreakdown, setFilteredLgAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [filteredPlAmountBreakdown, setFilteredPlAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  
  // Toggle between revenue and membership view
  const [viewMode, setViewMode] = useState<'revenue' | 'membership'>('revenue');
  
  // Toggle between membership data files
  const [membershipFile, setMembershipFile] = useState<'membersbeta.csv' | 'membersalpha.csv'>('membersbeta.csv');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both revenue and membership data
        const [revenueResponse, membershipResponse, amountBreakdownResp, amountBreakdownByLocResp] = await Promise.all([
          fetch('/api/revenue-data'),
          fetch(`/api/membership-data?file=${membershipFile}`),
          fetch('/api/revenue-data/amount-breakdown'),
          fetch('/api/revenue-data/amount-breakdown-by-location')
        ]);
        
        if (!revenueResponse.ok) {
          throw new Error(`Revenue API error! status: ${revenueResponse.status}`);
        }
        if (!membershipResponse.ok) {
          throw new Error(`Membership API error! status: ${membershipResponse.status}`);
        }
        if (!amountBreakdownResp.ok) {
          throw new Error(`Amount Breakdown API error! status: ${amountBreakdownResp.status}`);
        }
        if (!amountBreakdownByLocResp.ok) {
          throw new Error(`Amount Breakdown by Location API error! status: ${amountBreakdownByLocResp.status}`);
        }
        
        const revenueData: LocationDataResponse = await revenueResponse.json();
  const membershipData: MembershipDataResponse = await membershipResponse.json();
  const { breakdown } = await amountBreakdownResp.json();
  const amountByLoc = await amountBreakdownByLocResp.json();
        
        // Set revenue data
        setAllData(revenueData.allData);
        setLosGatosData(revenueData.losGatosData);
        setPleasantonData(revenueData.pleasantonData);
        
  // Set membership data
        setAllMembershipData(membershipData.allData);
        setLosGatosMembershipData(membershipData.losGatosData);
        setPleasantonMembershipData(membershipData.pleasantonData);
  // Set amount breakdown
  setAmountBreakdown(breakdown || []);
  setLgAmountBreakdown(amountByLoc?.losGatosData || []);
  setPlAmountBreakdown(amountByLoc?.pleasantonData || []);
        
        // Set available months from revenue data only (previous behavior)
        const months = getAvailableMonths(revenueData.allData);
        setAvailableMonths(months);
        
        if (months.length > 0) {
          setStartMonth(months[0]);
          setEndMonth(months[months.length - 1]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, [membershipFile]);

  useEffect(() => {
    if (startMonth && endMonth && allData.length > 0) {
      setFilteredAllData(filterDataByDateRange(allData, startMonth, endMonth));
      setFilteredLosGatosData(filterDataByDateRange(losGatosData, startMonth, endMonth));
      setFilteredPleasantonData(filterDataByDateRange(pleasantonData, startMonth, endMonth));
    }
    
    if (startMonth && endMonth && allMembershipData.length > 0) {
      setFilteredAllMembershipData(filterMembershipDataByDateRange(allMembershipData, startMonth, endMonth));
      setFilteredLosGatosMembershipData(filterMembershipDataByDateRange(losGatosMembershipData, startMonth, endMonth));
      setFilteredPleasantonMembershipData(filterMembershipDataByDateRange(pleasantonMembershipData, startMonth, endMonth));
    }
    if (startMonth && endMonth && amountBreakdown.length > 0) {
      setFilteredAmountBreakdown(filterAmountBreakdownByDateRange(amountBreakdown, startMonth, endMonth));
    }
    if (startMonth && endMonth && lgAmountBreakdown.length > 0) {
      setFilteredLgAmountBreakdown(filterAmountBreakdownByDateRange(lgAmountBreakdown, startMonth, endMonth));
    }
    if (startMonth && endMonth && plAmountBreakdown.length > 0) {
      setFilteredPlAmountBreakdown(filterAmountBreakdownByDateRange(plAmountBreakdown, startMonth, endMonth));
    }
  }, [startMonth, endMonth, allData, losGatosData, pleasantonData, allMembershipData, losGatosMembershipData, pleasantonMembershipData, amountBreakdown, lgAmountBreakdown, plAmountBreakdown]);

  const handleStartMonthChange = (month: string) => {
    setStartMonth(month);
    if (month > endMonth) {
      setEndMonth(month);
    }
  };

  const handleEndMonthChange = (month: string) => {
    setEndMonth(month);
  };

  // Legend keys for external legends on location-specific composition charts
  const lgLegendKeys = useMemo(() => computeAmountLegendKeys(filteredLgAmountBreakdown, 10), [filteredLgAmountBreakdown]);
  const plLegendKeys = useMemo(() => computeAmountLegendKeys(filteredPlAmountBreakdown, 10), [filteredPlAmountBreakdown]);
  // Legend keys for the overall composition chart
  const overallLegendKeys = useMemo(() => computeAmountLegendKeys(filteredAmountBreakdown, 10), [filteredAmountBreakdown]);

  if (loading) {
    return (
      <main className="w-full px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full px-4">
        <h1 className="text-3xl font-bold text-center text-red-600">Error Loading Data</h1>
        <div className="text-center text-gray-600 mt-4 space-y-2">
          <p className="font-semibold">{error}</p>
          <p className="text-sm">
            If you&#39;re seeing this in production, please ensure the CSV files are properly deployed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 space-y-8">
      {/* Header with toggle */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BAFC Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">MoM visualization</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow p-1 w-fit">
            <button
              onClick={() => setViewMode('revenue')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'revenue'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setViewMode('membership')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'membership'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Membership
            </button>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>
      
      {/* Date Range Selector */}
      <DateRangeSelector
        startMonth={startMonth}
        endMonth={endMonth}
        availableMonths={availableMonths}
        onStartMonthChange={handleStartMonthChange}
        onEndMonthChange={handleEndMonthChange}
      />
      
      {viewMode === 'revenue' ? (
        <>
          {/* Overall Revenue Chart */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Overall Monthly Revenue</h2>
            <RevenueChart data={filteredAllData} />
          </section>

          {/* Amount Breakdown by Transaction Value with legend to the right of header */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <h3 className="text-xl font-semibold text-gray-800">Revenue Composition by Transaction Amount</h3>
              <div className="sm:w-auto">
                <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-x-4 gap-y-2">
                  {overallLegendKeys.map((k, i) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-3 h-3 rounded-[2px]"
                        style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }}
                      />
                      <span className="text-xs text-gray-700">{k === 'Other' ? 'Other' : `$${k}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-2">Each bar shows the monthly total, built from segments proportional to common transaction amounts.</p>
            <RevenueAmountBreakdownChart data={filteredAmountBreakdown} topN={10} showLegend={false} />
          </section>

          {/* Location-specific Charts with Composition below each */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* Los Gatos column */}
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <LocationChart 
                  data={filteredLosGatosData} 
                  title="Los Gatos Location" 
                  color="#059669" 
                />
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <h4 className="text-lg font-semibold text-gray-800">Los Gatos Composition</h4>
                  <div className="sm:w-auto">
                    <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-x-4 gap-y-2">
                      {lgLegendKeys.map((k, i) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-3 h-3 rounded-[2px]"
                            style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }}
                          />
                          <span className="text-xs text-gray-700">{k === 'Other' ? 'Other' : `$${k}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <RevenueAmountBreakdownChart data={filteredLgAmountBreakdown} topN={10} showLegend={false} />
              </div>
            </div>

            {/* Pleasanton column */}
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <LocationChart 
                  data={filteredPleasantonData} 
                  title="Pleasanton Location" 
                  color="#dc2626" 
                />
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <h4 className="text-lg font-semibold text-gray-800">Pleasanton Composition</h4>
                  <div className="sm:w-auto">
                    <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-x-4 gap-y-2">
                      {plLegendKeys.map((k, i) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-3 h-3 rounded-[2px]"
                            style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }}
                          />
                          <span className="text-xs text-gray-700">{k === 'Other' ? 'Other' : `$${k}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <RevenueAmountBreakdownChart data={filteredPlAmountBreakdown} topN={10} showLegend={false} />
              </div>
            </div>
          </section>

          {/* Data Table */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Monthly Revenue Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Month</th>
                    <th className="px-4 py-2 text-right">Total Revenue</th>
                    <th className="px-4 py-2 text-right">Los Gatos</th>
                    <th className="px-4 py-2 text-right">Pleasanton</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllData.map((item: any, index: number) => {
                    const lgItem = filteredLosGatosData.find((lg: any) => lg.month === item.month);
                    const plItem = filteredPleasantonData.find((pl: any) => pl.month === item.month);
                    
                    return (
                      <tr key={item.month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-2 font-medium">{item.month}</td>
                        <td className="px-4 py-2 text-right">${Math.round(item.revenue).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">
                          {lgItem ? `$${Math.round(lgItem.revenue).toLocaleString()}` : 
                           <span className="text-gray-400 italic">No data</span>}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {plItem ? `$${Math.round(plItem.revenue).toLocaleString()}` : 
                           <span className="text-gray-400 italic">No data</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredAllData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No data available for the selected date range.
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Overall Membership Chart */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Overall Membership Overview</h2>
                <p className="text-sm text-gray-500">
                  Data source: {membershipFile === 'membersbeta.csv' ? 'Membership is Yes filter' : 'Client&#39;s First Membership is Yes filter'}
                </p>
              </div>
              
              {/* Membership File Toggle */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setMembershipFile('membersbeta.csv')}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    membershipFile === 'membersbeta.csv'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Memberships
                </button>
                <button
                  onClick={() => setMembershipFile('membersalpha.csv')}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    membershipFile === 'membersalpha.csv'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  First Memberships Only
                </button>
              </div>
            </div>
            <MembershipChart data={filteredAllMembershipData} />
          </section>

          {/* Location-specific Membership Charts */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <LocationMembershipChart 
                data={filteredLosGatosMembershipData} 
                title="Los Gatos Membership" 
                color="#059669" 
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <LocationMembershipChart 
                data={filteredPleasantonMembershipData} 
                title="Pleasanton Membership" 
                color="#dc2626" 
              />
            </div>
          </section>

          {/* Membership Data Table */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Monthly Membership Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Month</th>
                    <th className="px-4 py-2 text-right">Total Members</th>
                    <th className="px-4 py-2 text-right">Los Gatos</th>
                    <th className="px-4 py-2 text-right">Pleasanton</th>
                    <th className="px-4 py-2 text-right">New Members</th>
                    <th className="px-4 py-2 text-right">Canceled</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllMembershipData.map((item: any, index: number) => {
                    const lgItem = filteredLosGatosMembershipData.find((lg: any) => lg.month === item.month);
                    const plItem = filteredPleasantonMembershipData.find((pl: any) => pl.month === item.month);
                    
                    return (
                      <tr key={item.month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-2 font-medium">{item.month}</td>
                        <td className="px-4 py-2 text-right">{item.membershipCount}</td>
                        <td className="px-4 py-2 text-right">
                          {lgItem ? lgItem.membershipCount : 
                           <span className="text-gray-400 italic">No data</span>}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {plItem ? plItem.membershipCount : 
                           <span className="text-gray-400 italic">No data</span>}
                        </td>
                        <td className="px-4 py-2 text-right">{item.newMemberships}</td>
                        <td className="px-4 py-2 text-right">{item.canceledMemberships}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredAllMembershipData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No membership data available for the selected date range.
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
