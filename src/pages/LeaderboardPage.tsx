import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Medal, Crown, ArrowLeft, Loader2, Calendar, 
  Clock, AlertCircle, ChevronLeft, ChevronRight, ShieldAlert
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { UserAvatar } from '../components/ui/UserAvatar';
import { 
  getLeaderboard, getMyLeaderboardRank, getAvailableMonths, 
  getMonthlySummary
} from '../lib/leaderboardApi';
import type { 
  LeaderboardEntry, UserRankPeriod, MyLeaderboardData, AvailableMonth 
} from '../lib/leaderboardApi';

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, addToast, userProfile } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  // Leaderboard data state
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [resetSeconds, setResetSeconds] = useState<number | null>(null);

  // My personal rank data
  const [myRankData, setMyRankData] = useState<MyLeaderboardData | null>(null);
  const [isLoadingMyRank, setIsLoadingMyRank] = useState(false);

  // Monthly summary available months
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // format: "year-month"

  // Load available months
  useEffect(() => {
    async function loadMonths() {
      try {
        const res = await getAvailableMonths();
        if (res.code === 200 && res.data && res.data.length > 0) {
          setAvailableMonths(res.data);
          // Default to the first available month (usually current/newest)
          setSelectedMonth(`${res.data[0].year}-${res.data[0].month}`);
        }
      } catch (err) {
        console.error('Failed to fetch available months:', err);
      }
    }
    loadMonths();
  }, []);

  // Fetch Leaderboard entries based on active period, page, and selected month (if monthly)
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'monthly' && selectedMonth) {
        const [yearStr, monthStr] = selectedMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        
        const res = await getMonthlySummary({ year, month, page: currentPage, limit: 20 });
        if (res.code === 200) {
          setEntries(res.data.entries || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalEntries(res.data.total || 0);
          setResetSeconds(null); // Summary data doesn't have live reset seconds
        }
      } else {
        const res = await getLeaderboard(activeTab, currentPage, 20);
        if (res.code === 200) {
          setEntries(res.data.entries || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalEntries(res.data.total || 0);
          setResetSeconds(res.data.reset_seconds || null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard data:', err);
      addToast('error', 'Gagal memuat peringkat leaderboard');
      // Load mock fallback data to ensure the UI is functional
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch logged-in user rank
  const fetchMyRank = async () => {
    if (!isLoggedIn) return;
    setIsLoadingMyRank(true);
    try {
      const res = await getMyLeaderboardRank();
      if (res.code === 200) {
        setMyRankData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch personal rank details:', err);
    } finally {
      setIsLoadingMyRank(false);
    }
  };

  // Run data fetching
  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab, currentPage, selectedMonth]);

  // Fetch my rank details once on load or when login state changes
  useEffect(() => {
    fetchMyRank();
  }, [isLoggedIn]);

  // Handle tab switches
  const handleTabChange = (tab: 'daily' | 'weekly' | 'monthly') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Load mock data if endpoint fails
  const loadMockData = () => {
    setEntries([]);
    setTotalPages(1);
    setTotalEntries(0);
    setResetSeconds(null);
  };

  // Helper function to format countdown timer
  const formatCountdown = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return null;
    if (seconds <= 0) return 'Sedang mereset...';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days} hari ${hours} jam`;
    }
    if (hours > 0) {
      return `${hours} jam ${minutes} menit`;
    }
    return `${minutes} menit`;
  };

  // Get current active user's rank details for the selected period
  const getMyActivePeriodDetails = (): UserRankPeriod | null => {
    if (!myRankData) return null;
    if (activeTab === 'daily') return myRankData.daily;
    if (activeTab === 'weekly') return myRankData.weekly;
    return myRankData.monthly;
  };

  const myActivePeriod = getMyActivePeriodDetails();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
      
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 border-b border-border/20 gap-4 text-left">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 bg-bg-surface border border-border/60 hover:border-primary/40 text-text-secondary hover:text-primary rounded-xl transition-all active:scale-95 focus:outline-none"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-text-primary tracking-tight leading-tight flex items-center gap-2">
              <Trophy className="w-7 h-7 text-yellow-400" />
              Leaderboard XP
            </h1>
            <p className="text-xs text-muted font-medium mt-1">
              Peringkat penonton dengan dedikasi dan perolehan XP tertinggi.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-bg-surface border border-border/50 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto">
          {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-primary to-primary-light text-black shadow-glow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'daily' ? 'Harian' : tab === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Dropdown Filters */}
      {activeTab === 'monthly' && availableMonths.length > 0 && (
        <div className="flex items-center gap-2.5 p-3.5 bg-bg-surface/50 border border-border/40 rounded-2xl animate-fade-in text-left">
          <Calendar className="w-5 h-5 text-primary shrink-0" />
          <span className="text-xs font-bold text-text-secondary">Pilih Bulan Rekap:</span>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-bg-elevated border border-border text-sm text-text-primary px-3 py-1.5 rounded-xl outline-none focus:border-primary transition-colors cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Countdown Reset Banner */}
      {resetSeconds !== null && !isLoading && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-2xl text-left animate-fade-in">
          <Clock className="w-4 h-4 text-primary shrink-0 animate-pulse" />
          <span className="text-xs font-medium text-text-primary">
            Periode ini akan direset dalam: <strong className="text-primary-light font-bold">{formatCountdown(resetSeconds)}</strong>
          </span>
        </div>
      )}

      {/* User Personal Rank Banner (Only shown if logged in) */}
      {isLoggedIn && (
        <div className="bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border/40 rounded-2xl p-5 text-left relative overflow-hidden shadow-glow-sm">
          <div className="absolute top-1/2 right-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          {isLoadingMyRank ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-xs text-muted">Memuat peringkat Anda...</span>
            </div>
          ) : myActivePeriod ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center shrink-0">
                  <UserAvatar
                    src={userProfile.avatarUrl}
                    name={userProfile.name}
                    className="w-14 h-14 rounded-full border border-border"
                  />
                  {myRankData?.activeAvatarBorder?.imageUrl && (
                    <img
                      src={myRankData.activeAvatarBorder.imageUrl}
                      alt="Border"
                      className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none pointer-events-none z-20"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-text-primary">{userProfile.name}</h2>
                    {userProfile.isVip && (
                      <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-gradient-to-r from-yellow-500 to-amber-600 text-black uppercase tracking-wider">
                        VIP {userProfile.vipLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">@{userProfile.username || 'user'}</p>
                </div>
              </div>

              {/* XP and Rank badges */}
              <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                <div className="text-center">
                  <span className="text-xs text-muted block font-semibold uppercase">Total XP</span>
                  <span className="text-lg font-mono font-black text-primary">{myActivePeriod.total_xp}</span>
                </div>
                <div className="w-px h-8 bg-border/40" />
                <div className="text-center">
                  <span className="text-xs text-muted block font-semibold uppercase">Peringkat</span>
                  {myActivePeriod.rank ? (
                    <span className="text-xl font-black text-yellow-400 font-heading flex items-center gap-1">
                      #{myActivePeriod.rank}
                      <span className="text-xs text-muted font-normal font-sans">/ {myActivePeriod.total_users}</span>
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-muted">Belum Masuk Peringkat</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-muted">Gagal memuat detail profil.</div>
          )}
        </div>
      )}

      {/* Guest Login Callout Banner */}
      {!isLoggedIn && (
        <div className="bg-bg-surface border border-dashed border-border/60 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="w-8 h-8 text-muted/60" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">Ingin melihat peringkat Anda?</h3>
            <p className="text-xs text-muted mt-1">Masuk ke akun Anda untuk melacak peringkat XP dan bersaing dengan penonton lainnya.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-light text-black text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow"
          >
            Masuk Sekarang
          </button>
        </div>
      )}

      {/* Main Leaderboard Rankings */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted">Memuat data peringkat...</p>
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-6">
          
          {/* Top 3 Podium layout */}
          {currentPage === 1 && (
            <div className="bg-bg-surface/50 border border-border/30 rounded-2xl pt-12 pb-6 flex flex-col items-center select-none shadow-glow-sm">
              <div className="flex items-end justify-center w-full max-w-lg px-6 mt-2 h-64">
                {/* 2nd Place */}
                {entries[1] && (
                  <div className="flex flex-col items-center w-1/3">
                    <div className="relative group flex flex-col items-center">
                      <div className="absolute -top-7 text-text-secondary/70 font-black text-xs font-heading">#2</div>
                      <div className="relative flex items-center justify-center shrink-0">
                        <UserAvatar
                          src={entries[1].user.avatarUrl}
                          name={entries[1].user.fullName || entries[1].user.username}
                          className="w-16 h-16 rounded-full border-2 border-slate-400 shadow-lg group-hover:scale-105 transition-all"
                        />
                        {entries[1].user.activeAvatarBorder && (
                          <img
                            src={entries[1].user.activeAvatarBorder.imageUrl}
                            alt="Border"
                            className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none pointer-events-none z-20"
                          />
                        )}
                      </div>
                      <span className="text-slate-300 mt-2 font-bold text-xs truncate max-w-[85px]">
                        {entries[1].user.fullName || entries[1].user.username}
                      </span>
                      <span className="text-[10px] text-muted font-semibold mt-0.5">
                        {entries[1].total_xp} XP
                      </span>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full bg-gradient-to-t from-slate-500/25 to-slate-500/5 border-t border-slate-500/30 rounded-t-2xl h-20 mt-3 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <div className="text-3xl font-black text-slate-400 font-heading">2</div>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {entries[0] && (
                  <div className="flex flex-col items-center w-1/3 z-10 -mx-1">
                    <div className="relative group flex flex-col items-center">
                      <Crown className="absolute -top-8 w-7 h-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-bounce" />
                      <div className="relative flex items-center justify-center shrink-0">
                        <UserAvatar
                          src={entries[0].user.avatarUrl}
                          name={entries[0].user.fullName || entries[0].user.username}
                          className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-glow-sm group-hover:scale-105 transition-all"
                        />
                        {entries[0].user.activeAvatarBorder && (
                          <img
                            src={entries[0].user.activeAvatarBorder.imageUrl}
                            alt="Border"
                            className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none pointer-events-none z-20"
                          />
                        )}
                      </div>
                      <span className="text-yellow-400 mt-2 font-black text-sm truncate max-w-[100px] drop-shadow-[0_0_4px_rgba(250,204,21,0.2)]">
                        {entries[0].user.fullName || entries[0].user.username}
                      </span>
                      <span className="text-xs text-yellow-300 font-extrabold mt-0.5">
                        {entries[0].total_xp} XP
                      </span>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full bg-gradient-to-t from-yellow-500/25 to-yellow-500/5 border-t border-yellow-500/30 rounded-t-2xl h-28 mt-3 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <div className="text-4xl font-black text-yellow-400 font-heading">1</div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {entries[2] && (
                  <div className="flex flex-col items-center w-1/3">
                    <div className="relative group flex flex-col items-center">
                      <div className="absolute -top-7 text-text-secondary/70 font-black text-xs font-heading">#3</div>
                      <div className="relative flex items-center justify-center shrink-0">
                        <UserAvatar
                          src={entries[2].user.avatarUrl}
                          name={entries[2].user.fullName || entries[2].user.username}
                          className="w-14 h-14 rounded-full border border-amber-600 shadow-lg group-hover:scale-105 transition-all"
                        />
                        {entries[2].user.activeAvatarBorder && (
                          <img
                            src={entries[2].user.activeAvatarBorder.imageUrl}
                            alt="Border"
                            className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none pointer-events-none z-20"
                          />
                        )}
                      </div>
                      <span className="text-amber-600 mt-2 font-bold text-xs truncate max-w-[85px]">
                        {entries[2].user.fullName || entries[2].user.username}
                      </span>
                      <span className="text-[10px] text-muted font-semibold mt-0.5">
                        {entries[2].total_xp} XP
                      </span>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full bg-gradient-to-t from-amber-700/25 to-amber-700/5 border-t border-amber-700/30 rounded-t-2xl h-14 mt-3 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <div className="text-2xl font-black text-amber-600 font-heading">3</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* List layout for ranks (showing ranks 4-100 or paginated list) */}
          <div className="space-y-2.5">
            {totalEntries > 0 && (
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5 px-1">
                Peringkat Lainnya ({totalEntries} Penonton)
              </span>
            )}
            {/* Filter entries depending on current page */}
            {entries.slice(currentPage === 1 ? 3 : 0).map((entry) => (
              <div
                key={entry.user.id}
                className="flex items-center justify-between p-4 bg-bg-surface/50 border border-border/30 hover:border-primary/10 rounded-2xl transition-all hover:-translate-y-[1px] hover:bg-bg-surface"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Rank number or medal */}
                  <span className="w-8 text-center shrink-0 flex items-center justify-center">
                    {entry.rank === 1 ? (
                      <Crown className="w-5 h-5 text-yellow-400" />
                    ) : entry.rank === 2 ? (
                      <Medal className="w-5 h-5 text-slate-400" />
                    ) : entry.rank === 3 ? (
                      <Medal className="w-5 h-5 text-amber-600" />
                    ) : (
                      <span className="text-sm font-black font-heading text-text-secondary">
                        {entry.rank}
                      </span>
                    )}
                  </span>

                  {/* User Avatar with custom border */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <UserAvatar
                      src={entry.user.avatarUrl}
                      name={entry.user.fullName || entry.user.username}
                      className="w-10 h-10 rounded-full"
                    />
                    {entry.user.activeAvatarBorder && (
                      <img
                        src={entry.user.activeAvatarBorder.imageUrl}
                        alt="Border"
                        className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none pointer-events-none z-20"
                      />
                    )}
                  </div>

                  {/* Username/full name */}
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-text-primary truncate block max-w-[140px] sm:max-w-none">
                        {entry.user.fullName || entry.user.username}
                      </span>
                      {entry.user.vip && entry.user.vip.status === 'ACTIVE' && (
                        <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-gradient-to-r from-yellow-500 to-amber-600 text-black uppercase tracking-wider scale-90">
                          VIP
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted truncate block">
                      @{entry.user.username}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-mono font-black text-primary">
                    {entry.total_xp}
                  </span>
                  <span className="text-[10px] text-muted block font-semibold uppercase tracking-wider">
                    XP
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 select-none">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2.5 bg-bg-surface border border-border/60 hover:border-primary/40 rounded-xl text-text-secondary hover:text-primary transition-all disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:text-text-secondary disabled:cursor-not-allowed focus:outline-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-text-secondary">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2.5 bg-bg-surface border border-border/60 hover:border-primary/40 rounded-xl text-text-secondary hover:text-primary transition-all disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:text-text-secondary disabled:cursor-not-allowed focus:outline-none"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-border/60 rounded-2xl bg-bg-surface/20 flex flex-col items-center justify-center text-left">
          <AlertCircle className="w-10 h-10 text-muted/40 mb-3" />
          <p className="text-sm text-muted font-medium">Belum ada aktivitas di periode ini.</p>
        </div>
      )}

    </div>
  );
};

export default LeaderboardPage;
