'use client';
import React, { useState, useEffect } from 'react';
import { filterDataByDateRange, getAvailableMonths, MonthlyRevenue, MonthlyMembership, filterMembershipDataByDateRange, getAvailableMembershipMonths } from '../lib/clientUtils';
import { RevenueChart } from '../components/RevenueChart';
import { LocationChart } from '../components/LocationChart';
import { MembershipChart } from '../components/MembershipChart';
import { LocationMembershipChart } from '../components/LocationMembershipChart';
import { DateRangeSelector } from '../components/DateRangeSelector';

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
  
  // Toggle between revenue and membership view
  const [viewMode, setViewMode] = useState<'revenue' | 'membership'>('revenue');
  
  // Toggle between membership data files
  const [membershipFile, setMembershipFile] = useState<'membersbeta.csv' | 'membersalpha.csv'>('membersbeta.csv');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both revenue and membership data
        const [revenueResponse, membershipResponse] = await Promise.all([
          fetch('/api/revenue-data'),
          fetch(`/api/membership-data?file=${membershipFile}`)
        ]);
        
        if (!revenueResponse.ok) {
          throw new Error(`Revenue API error! status: ${revenueResponse.status}`);
        }
        if (!membershipResponse.ok) {
          throw new Error(`Membership API error! status: ${membershipResponse.status}`);
        }
        
        const revenueData: LocationDataResponse = await revenueResponse.json();
        const membershipData: MembershipDataResponse = await membershipResponse.json();
        
        // Set revenue data
        setAllData(revenueData.allData);
        setLosGatosData(revenueData.losGatosData);
        setPleasantonData(revenueData.pleasantonData);
        
        // Set membership data
        setAllMembershipData(membershipData.allData);
        setLosGatosMembershipData(membershipData.losGatosData);
        setPleasantonMembershipData(membershipData.pleasantonData);
        
        // Set available months from revenue data (assuming revenue data has more complete date range)
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
  }, [startMonth, endMonth, allData, losGatosData, pleasantonData, allMembershipData, losGatosMembershipData, pleasantonMembershipData]);

  const handleStartMonthChange = (month: string) => {
    setStartMonth(month);
    if (month > endMonth) {
      setEndMonth(month);
    }
  };

  const handleEndMonthChange = (month: string) => {
    setEndMonth(month);
  };

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
            If you're seeing this in production, please ensure the CSV files are properly deployed.
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
          <p className="text-sm text-gray-500">MoM visualization</p>
        </div>
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

          {/* Location-specific Charts */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <LocationChart 
                data={filteredLosGatosData} 
                title="Los Gatos Location" 
                color="#059669" 
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <LocationChart 
                data={filteredPleasantonData} 
                title="Pleasanton Location" 
                color="#dc2626" 
              />
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
                  Data source: {membershipFile === 'membersbeta.csv' ? 'Membership is Yes filter' : 'Client\'s First Membership is Yes filter'}
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
