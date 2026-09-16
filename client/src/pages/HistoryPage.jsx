import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, Trash2, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { getSearchHistory, deleteSearchHistory } from '../api/search';
import { Button } from '../components/common/Button';

export const HistoryPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['searchHistory'],
    queryFn: getSearchHistory
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['searchHistory'] })
  });

  const historyItems = historyData?.data || [];

  const handleReRun = (promptText) => {
    navigate('/app/search', { state: { initialPrompt: promptText } });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-primary-600 h-7 w-7" /> Discovery Search History
          </h1>
          <p className="text-slate-500 text-sm mt-1">Review, re-run, or clear all historical AI search executions and lead extractions.</p>
        </div>
        <Button onClick={() => navigate('/app/search')} className="gap-2">
          <Search className="h-4 w-4" /> New AI Search
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-800 flex justify-between items-center">
          <span>Search Log ({historyItems.length})</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading discovery history...</div>
        ) : historyItems.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Activity className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No Search History Found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Run your first natural language prompt on the AI Search page to discover leads.</p>
            <Button onClick={() => navigate('/app/search')} className="gap-2">
              <Search className="h-4 w-4" /> Go to AI Search
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historyItems.map((item) => (
              <div key={item._id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Search className="h-4 w-4 text-primary-600 shrink-0" />
                    <span className="font-semibold text-slate-900 text-base">{item.originalPrompt}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pl-7">
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {item.statistics?.leadsCreated || 0} leads created
                    </span>
                    <span>{item.statistics?.discovered || 0} discovered</span>
                    <span>{item.statistics?.duplicatesRemoved || 0} duplicates skipped</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3 w-3" /> {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {item.parsedQuery && (
                    <div className="pl-7 flex gap-2 pt-1">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        Industry: {item.parsedQuery.industry || 'Any'}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        City: {item.parsedQuery.location?.city || 'Any'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 self-end md:self-center">
                  <Button variant="secondary" className="text-xs gap-1" onClick={() => handleReRun(item.originalPrompt)}>
                    Re-run <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <button
                    onClick={() => deleteMutation.mutate(item._id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-slate-100"
                    title="Delete History Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
