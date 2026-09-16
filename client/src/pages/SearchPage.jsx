import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { parseSearchPrompt, executeSearch } from '../api/search';
import { Button } from '../components/common/Button';

export const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState(location.state?.initialPrompt || '');
  const [parsedData, setParsedData] = useState(null);

  useEffect(() => {
    if (location.state?.initialPrompt) {
      setPrompt(location.state.initialPrompt);
    }
  }, [location.state]);

  const parseMutation = useMutation({
    mutationFn: parseSearchPrompt,
    onSuccess: (data) => {
      setParsedData(data.data);
    },
    onError: (error) => {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to parse prompt');
    }
  });

  const executeMutation = useMutation({
    mutationFn: () => executeSearch(prompt, parsedData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsStats'] });
      alert(`Successfully found ${data.data.search.statistics.leadsCreated} leads out of ${data.data.search.statistics.discovered} discovered.`);
      navigate('/app/leads');
    },
    onError: (error) => {
      console.error(error);
      alert(error.response?.data?.message || 'Search execution failed');
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setParsedData(null);
    parseMutation.mutate(prompt);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-primary-600 h-8 w-8" />
          AI Lead Discovery
        </h1>
        <p className="mt-2 text-slate-600 text-lg">
          Describe the businesses you want to find using natural language.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
          <textarea
            rows={4}
            className="block w-full resize-none border-0 py-4 px-4 text-slate-900 placeholder:text-slate-400 focus:ring-0 text-lg leading-relaxed bg-transparent outline-none"
            placeholder="Find 25 interior designers in Ahmedabad without a website and with a public email address."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={parseMutation.isPending || executeMutation.isPending}
          />
          <div className="flex items-center justify-between py-3 px-4 bg-slate-50 border-t border-slate-100">
            <div className="flex gap-2">
              <button 
                type="button"
                className="text-xs font-medium text-slate-500 hover:text-slate-700 bg-white px-2 py-1 rounded border border-slate-200"
                onClick={() => setPrompt("Find cafes in Tokyo with email addresses")}
              >
                Cafes in Tokyo
              </button>
              <button 
                type="button"
                className="text-xs font-medium text-slate-500 hover:text-slate-700 bg-white px-2 py-1 rounded border border-slate-200"
                onClick={() => setPrompt("Find accounting firms in London without websites")}
              >
                Accounting in London
              </button>
            </div>
            <Button type="submit" isLoading={parseMutation.isPending} disabled={executeMutation.isPending} className="gap-2">
              {parseMutation.isPending ? 'Understanding Query' : 'Discover Leads'}
              {!parseMutation.isPending && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </form>

      {parsedData && (
        <div className="mt-8 bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="text-green-400 h-6 w-6" />
            <h3 className="text-lg font-semibold text-white">AI understood your request</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 p-3 rounded-lg">
              <span className="block text-xs text-slate-400 mb-1">Industry</span>
              <span className="font-medium">{parsedData.industry || 'Any'}</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg">
              <span className="block text-xs text-slate-400 mb-1">Location</span>
              <span className="font-medium">{parsedData.location?.city || 'Any'}</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg">
              <span className="block text-xs text-slate-400 mb-1">Target Limit</span>
              <span className="font-medium">{parsedData.limit || 20}</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg">
              <span className="block text-xs text-slate-400 mb-1">Website Rule</span>
              <span className="font-medium capitalize">{parsedData.websiteRequirement || 'Any'}</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <Button 
              variant="primary" 
              className="bg-white text-slate-900 hover:bg-slate-100 gap-2 h-12 px-6 rounded-xl font-semibold"
              onClick={() => executeMutation.mutate()}
              isLoading={executeMutation.isPending}
            >
              {executeMutation.isPending ? 'Searching the web...' : 'Confirm & Run Discovery'}
              {!executeMutation.isPending && <ArrowRight className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
