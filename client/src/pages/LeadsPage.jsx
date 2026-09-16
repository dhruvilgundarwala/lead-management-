import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Search, Mail, Phone, Globe } from 'lucide-react';
import { getLeads } from '../api/leads';
import { Button } from '../components/common/Button';

export const LeadsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads
  });

  const leads = data?.data || [];

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-primary-600 h-6 w-6" />
            Leads
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your discovered business leads and track outreach.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/app/search">
            <Button>Discover New Leads</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="pl-9 h-9 w-full rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <select className="h-9 rounded-md border border-slate-300 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No leads yet</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                You haven't discovered any leads yet. Start by running an AI search to find businesses in your target market.
              </p>
              <Link to="/app/search">
                <Button>Find Leads</Button>
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link to={`/app/leads/${lead._id}`} className="font-semibold text-slate-900 hover:text-primary-600 truncate max-w-xs">
                          {lead.business.name}
                        </Link>
                        <span className="text-xs text-slate-500 truncate max-w-xs">{lead.business.category} • {lead.location.city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-slate-400">
                        <Mail className={`h-4 w-4 ${lead.contact.email ? 'text-primary-600' : ''}`} />
                        <Phone className={`h-4 w-4 ${lead.contact.phone ? 'text-green-600' : ''}`} />
                        <Globe className={`h-4 w-4 ${lead.contact.website ? 'text-blue-600' : ''}`} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                        {lead.score}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/app/leads/${lead._id}`}>
                        <Button variant="ghost" size="sm" className="text-primary-600">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
