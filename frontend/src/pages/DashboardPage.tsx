import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CentralContainer } from '../components/CentralContainer';
import { studyApi } from '../api';
import type { ScheduleAmount } from '../types';
import { getAuthData, clearAuthData } from '../utils/auth';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ScheduleAmount | null>(null);
  const [loading, setLoading] = useState(true);
  const authData = getAuthData();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await studyApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  return (
    <CentralContainer>
      <div className="bg-white md:bg-white bg-transparent rounded-lg md:rounded-lg md:shadow-md p-4 md:p-8">
        {/* Заголовок */}
        <div className="text-center mb-4">
          <h1 className="font-bold text-4xl md:text-6xl lg:text-7xl">flips</h1>
        </div>

        {/* Приветствие и статистика */}
        <div className="mb-4">
          <h2 className="text-xl mb-2">Hi, {authData?.username}!</h2>
          <p className="text-gray-700 mb-2">Here's your goal for today:</p>

          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : stats ? (
            <div className="flex justify-around text-center mb-4">
              <div>
                <div className="text-gray-600 mb-1">new</div>
                <div className="text-2xl font-bold">{stats.new}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">cram</div>
                <div className="text-2xl font-bold">{stats.cram}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">due</div>
                <div className="text-2xl font-bold">{stats.due}</div>
              </div>
            </div>
          ) : (
            <div className="text-red-500">Failed to load stats</div>
          )}
        </div>

        {/* Меню - Start по центру, остальные grid */}
        <nav className="space-y-2">
          <button
            onClick={() => navigate('/study')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Start
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/add')}
              className="px-4 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Add
            </button>

            <button
              disabled
              className="px-4 py-3 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed"
            >
              Stats
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Settings
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>
      </div>
    </CentralContainer>
  );
};
