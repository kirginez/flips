import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CentralContainer } from '../components/CentralContainer';
import { statsApi } from '../api';
import type { StatsOverview, HardestCard, DueChartData, ActivityData, TodayStats } from '../types';

export const StatsPage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [hardestCards, setHardestCards] = useState<HardestCard[]>([]);
  const [dueChart, setDueChart] = useState<DueChartData[]>([]);
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [overviewData, hardestData, dueChartData, activityData, todayData] = await Promise.all([
          statsApi.getOverview(),
          statsApi.getHardest(10),
          statsApi.getDueChart(30),
          statsApi.getActivity(365),
          statsApi.getToday(),
        ]);
        setOverview(overviewData);
        setHardestCards(hardestData);
        setDueChart(dueChartData);
        setActivity(activityData);
        setTodayStats(todayData);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const getActivityColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100';
    if (count < 5) return 'bg-green-200';
    if (count < 10) return 'bg-green-400';
    if (count < 20) return 'bg-green-600';
    return 'bg-green-800';
  };

  const getActivityDataMap = (): Map<string, number> => {
    const map = new Map<string, number>();
    activity.forEach((item) => {
      map.set(item.date, item.count);
    });
    return map;
  };

  const generateActivityGrid = (): Array<{ date: string; count: number }> => {
    const today = new Date();
    const days: Array<{ date: string; count: number }> = [];
    const activityMap = getActivityDataMap();

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0,
      });
    }
    return days;
  };

  const getMaxDueCount = (): number => {
    if (dueChart.length === 0) return 1;
    return Math.max(...dueChart.map((item) => item.count), 1);
  };

  const activityGrid = generateActivityGrid();
  const maxDueCount = getMaxDueCount();

  return (
    <CentralContainer>
      <div className="bg-white md:bg-white bg-transparent rounded-lg md:rounded-lg md:shadow-md p-4 md:p-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-gray-600 hover:text-gray-800 flex items-center"
        >
          ← Menu
        </button>

        <h2 className="text-2xl font-bold mb-6">Statistics</h2>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-8">
            {overview && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-gray-600 text-sm mb-1">Total</div>
                    <div className="text-2xl font-bold">{overview.total}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-gray-600 text-sm mb-1">New</div>
                    <div className="text-2xl font-bold">{overview.new}</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-gray-600 text-sm mb-1">Cram</div>
                    <div className="text-2xl font-bold">{overview.cram}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-gray-600 text-sm mb-1">Due</div>
                    <div className="text-2xl font-bold">{overview.due}</div>
                  </div>
                </div>
              </div>
            )}

            {todayStats && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Today</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-600 text-sm mb-1">Cards processed</div>
                      <div className="text-2xl font-bold">{todayStats.count}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-sm mb-1">Time spent</div>
                      <div className="text-2xl font-bold">{todayStats.time_spent || '0:00'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hardestCards.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Hardest Cards</h3>
                <div className="space-y-2">
                  {hardestCards.map((item, index) => (
                    <div key={item.card.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold">{item.card.word}</div>
                          <div className="text-sm text-gray-600">{item.card.translation}</div>
                          {item.card.definition && (
                            <div className="text-xs text-gray-500 mt-1">{item.card.definition}</div>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm text-gray-600">Ease</div>
                          <div className="text-lg font-bold">{item.ease.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dueChart.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Due Cards (30 days)</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-end gap-1 h-48">
                    {dueChart.map((item, index) => {
                      const height = (item.count / maxDueCount) * 100;
                      return (
                        <div
                          key={index}
                          className="flex-1 bg-blue-600 rounded-t hover:bg-blue-700 transition-colors relative group"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${item.date}: ${item.count} cards`}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {item.date}: {item.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    {dueChart[0]?.date} - {dueChart[dueChart.length - 1]?.date}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-4">Activity (1 year)</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(53, minmax(0, 1fr))' }}>
                  {activityGrid.map((item, index) => (
                    <div
                      key={index}
                      className={`aspect-square rounded ${getActivityColor(item.count)} hover:ring-2 hover:ring-gray-400 transition-all relative group`}
                      title={`${item.date}: ${item.count} cards`}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {item.date}: {item.count} cards
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded bg-gray-100"></div>
                    <div className="w-3 h-3 rounded bg-green-200"></div>
                    <div className="w-3 h-3 rounded bg-green-400"></div>
                    <div className="w-3 h-3 rounded bg-green-600"></div>
                    <div className="w-3 h-3 rounded bg-green-800"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CentralContainer>
  );
};

