import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, Send, Clock, CheckCircle, Trash2, X, Sparkles, AlertCircle } from 'lucide-react';
import { getCampaigns, createCampaign, deleteCampaign, updateCampaign } from '../api/campaigns';
import { getLeads } from '../api/leads';
import { Button } from '../components/common/Button';

export const CampaignsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    status: 'Active',
    selectedLeads: []
  });

  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns
  });

  const { data: leadsData } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads
  });

  const campaigns = campaignsData?.data || [];
  const leads = leadsData?.data || [];

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsModalOpen(false);
      setFormData({ name: '', subject: '', body: '', status: 'Active', selectedLeads: [] });
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to create campaign')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
    onError: (err) => alert(err.response?.data?.message || 'Failed to delete campaign')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateCampaign(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.body) {
      alert('Please fill in Name, Subject, and Email Body');
      return;
    }
    createMutation.mutate({
      name: formData.name,
      subject: formData.subject,
      body: formData.body,
      status: formData.status,
      leads: formData.selectedLeads
    });
  };

  const toggleLeadSelection = (leadId) => {
    setFormData((prev) => ({
      ...prev,
      selectedLeads: prev.selectedLeads.includes(leadId)
        ? prev.selectedLeads.filter(id => id !== leadId)
        : [...prev.selectedLeads, leadId]
    }));
  };

  const totalSent = campaigns.reduce((acc, c) => acc + (c.statistics?.sent || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (c.statistics?.opened || 0), 0);
  const totalReplied = campaigns.reduce((acc, c) => acc + (c.statistics?.replied || 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="text-primary-600 h-7 w-7" /> Dynamic Email Campaigns
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage, dispatch, and track automated email outreach campaigns.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalSent}</div>
            <div className="text-xs text-slate-500">Emails Dispatched</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {totalSent > 0 ? `${((totalOpened / totalSent) * 100).toFixed(1)}%` : '0.0%'}
            </div>
            <div className="text-xs text-slate-500">Avg. Open Rate</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {totalSent > 0 ? `${((totalReplied / totalSent) * 100).toFixed(1)}%` : '0.0%'}
            </div>
            <div className="text-xs text-slate-500">Avg. Response Rate</div>
          </div>
        </div>
      </div>

      {isLoadingCampaigns ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          Loading campaigns data...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
          <Mail className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Campaigns Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">Create your first automated email campaign to reach out to discovered leads.</p>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create First Campaign
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-800 flex justify-between items-center">
            <span>All Campaigns ({campaigns.length})</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <th className="px-6 py-3">Campaign Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Target Leads</th>
                <th className="px-6 py-3">Dispatched</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {campaigns.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div>{c.name}</div>
                    <div className="text-xs text-slate-400 font-normal truncate max-w-xs">{c.subject}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={c.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: c._id, status: e.target.value })}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 focus:outline-none ${
                        c.status === 'Active' ? 'bg-green-50 text-green-800' :
                        c.status === 'Scheduled' ? 'bg-amber-50 text-amber-800' :
                        c.status === 'Completed' ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Draft">Draft</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{c.leads?.length || 0} leads</td>
                  <td className="px-6 py-4 text-slate-600">{c.statistics?.sent || 0}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(c._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Creating Campaign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" /> Create New Email Campaign
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Tokyo Cafes Outreach"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject Line</label>
                <input
                  type="text"
                  placeholder="e.g. Quick proposal for {{Business Name}}"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Message Body</label>
                <textarea
                  rows={4}
                  placeholder="Write your email pitch here..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-primary-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Select Target Leads ({formData.selectedLeads.length} selected)</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 p-2">
                  {leads.length === 0 ? (
                    <div className="text-xs text-slate-400 p-2 text-center">No leads available yet. Run an AI discovery search first.</div>
                  ) : (
                    leads.map((l) => (
                      <label key={l._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer rounded">
                        <input
                          type="checkbox"
                          checked={formData.selectedLeads.includes(l._id)}
                          onChange={() => toggleLeadSelection(l._id)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-900">{l.business?.name}</span>
                          <span className="text-slate-400 ml-2">({l.contact?.email || 'No email'})</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending}>Launch Campaign</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
