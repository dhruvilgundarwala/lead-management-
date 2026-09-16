import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Clock, CheckCircle2, Trash2, X, AlertCircle } from 'lucide-react';
import { getFollowUps, createFollowUp, updateFollowUpStatus, deleteFollowUp } from '../api/followups';
import { getLeads } from '../api/leads';
import { Button } from '../components/common/Button';

export const FollowUpsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '',
    scheduledAt: new Date().toISOString().slice(0, 16),
    note: '',
    priority: 'Medium'
  });

  const { data: followUpsData, isLoading } = useQuery({
    queryKey: ['followups'],
    queryFn: getFollowUps
  });

  const { data: leadsData } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads
  });

  const followUps = followUpsData?.data || [];
  const leads = leadsData?.data || [];

  const createMutation = useMutation({
    mutationFn: createFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      setIsModalOpen(false);
      setFormData({ leadId: '', scheduledAt: new Date().toISOString().slice(0, 16), note: '', priority: 'Medium' });
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to schedule follow-up')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateFollowUpStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['followups'] })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFollowUp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['followups'] })
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.leadId || !formData.scheduledAt) {
      alert('Please select a target lead and date/time');
      return;
    }
    createMutation.mutate({
      lead: formData.leadId,
      scheduledAt: formData.scheduledAt,
      note: formData.note,
      priority: formData.priority
    });
  };

  const pendingFollowUps = followUps.filter(f => f.status === 'Pending');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="text-primary-600 h-7 w-7" /> Scheduled Follow-ups
          </h1>
          <p className="text-slate-500 text-sm mt-1">Never miss a potential client response with smart follow-up reminders.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Schedule Follow-up
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between">
          <span>Upcoming Schedule ({followUps.length})</span>
          <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">{pendingFollowUps.length} Pending</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading follow-ups...</div>
        ) : followUps.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No Follow-ups Scheduled</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Set reminders for leads you need to contact again.</p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Schedule First Follow-up
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {followUps.map((item) => (
              <div key={item._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900 text-base">{item.lead?.business?.name || 'Unknown Business'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      item.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                      item.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.priority} Priority
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-4">
                    <span>{item.lead?.contact?.email || item.lead?.contact?.phone || 'No direct contact'}</span>
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Clock className="h-3.5 w-3.5 text-primary-600" /> {new Date(item.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                  {item.note && <p className="text-xs text-slate-600 pt-1 italic">"{item.note}"</p>}
                </div>
                <div className="flex items-center gap-3">
                  {item.status === 'Pending' ? (
                    <Button
                      variant="secondary"
                      className="text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: item._id, status: 'Completed' })}
                    >
                      Mark Completed
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="text-xs text-slate-500"
                      onClick={() => updateStatusMutation.mutate({ id: item._id, status: 'Pending' })}
                    >
                      Re-open
                    </Button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(item._id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Scheduling Followup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" /> Schedule Follow-Up Reminder
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Lead</label>
                <select
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-primary-500 bg-white"
                  required
                >
                  <option value="">-- Select a Lead --</option>
                  {leads.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.business?.name} ({l.location?.city || 'No city'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-primary-500 bg-white"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reminder Context</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Call to ask about the website proposal sent last week..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending}>Set Reminder</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
