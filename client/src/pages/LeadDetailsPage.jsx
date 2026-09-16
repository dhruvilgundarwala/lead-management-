import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Globe, Mail, Phone, ShieldAlert, Zap } from 'lucide-react';
import { getLead, verifyLead } from '../api/leads';
import { Button } from '../components/common/Button';

export const LeadDetailsPage = () => {
  const { leadId } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => getLead(leadId)
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyLead(leadId),
    onSuccess: (res) => {
      queryClient.setQueryData(['lead', leadId], res);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to verify lead');
    }
  });

  const lead = data?.data;

  if (isLoading) return <div className="p-8 text-slate-500">Loading lead details...</div>;
  if (!lead) return <div className="p-8 text-red-500">Lead not found.</div>;

  const websiteStatus = lead.contact?.websiteStatus || 'unknown';
  const emailStatus = lead.contact?.emailStatus || 'unknown';

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-6">
        <Link to="/app/leads" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{lead.business?.name || 'Unnamed Business'}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                {lead.status || 'NEW'}
              </span>
              <span>Score: <strong className="text-blue-600">{lead.score || 0}</strong></span>
              <span>•</span>
              <span className="capitalize">{lead.business?.category || 'General'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => verifyMutation.mutate()}
              isLoading={verifyMutation.isPending}
              className="bg-white"
            >
              <ShieldAlert className="mr-2 h-4 w-4 text-slate-500" />
              Verify Info
            </Button>
            <Link to={`/app/leads/${lead._id}/email`}>
              <Button className="bg-primary-600 text-white hover:bg-primary-700">
                <Zap className="mr-2 h-4 w-4" />
                AI Generate Email
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-400" />
              Business Info
            </h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Industry</dt>
                <dd className="font-medium text-slate-900 capitalize">{lead.business?.industry || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Source</dt>
                <dd className="font-medium text-slate-900">
                  {lead.source?.sourceUrl ? (
                    <a href={lead.source.sourceUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                      {lead.source?.provider || 'Web'}
                    </a>
                  ) : (
                    <span>{lead.source?.provider || 'Web'}</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-slate-400" />
              Location
            </h3>
            <address className="text-sm not-italic text-slate-700 leading-relaxed">
              {lead.location?.address && <div>{lead.location.address}</div>}
              <div>
                {lead.location?.city && `${lead.location.city}, `}
                {lead.location?.state && `${lead.location.state} `}
                {lead.location?.postalCode}
              </div>
              {lead.location?.country && <div>{lead.location.country}</div>}
              {!lead.location?.city && !lead.location?.address && <span className="text-slate-400">Location not available</span>}
            </address>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Contact Verification</h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              <div className="p-5 flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="mt-0.5"><Globe className="h-5 w-5 text-slate-400" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Website</p>
                    <div className="mt-1 flex items-center gap-2">
                      {lead.contact?.website ? (
                        <a href={lead.contact.website.startsWith('http') ? lead.contact.website : `https://${lead.contact.website}`} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline">
                          {lead.contact.website}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">No website listed</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    websiteStatus === 'verified_found' ? 'bg-green-100 text-green-800' :
                    websiteStatus === 'not_listed' ? 'bg-slate-100 text-slate-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {websiteStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="p-5 flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="mt-0.5"><Mail className="h-5 w-5 text-slate-400" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Email Address</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {lead.contact?.email || <span className="text-slate-400">No email found</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    emailStatus === 'verified_public' ? 'bg-green-100 text-green-800' :
                    emailStatus === 'not_found' ? 'bg-red-100 text-red-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {emailStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="p-5 flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="mt-0.5"><Phone className="h-5 w-5 text-slate-400" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Phone Number</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {lead.contact?.phone || <span className="text-slate-400">No phone listed</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
              <span>Last verified: {lead.verification?.lastVerifiedAt ? new Date(lead.verification.lastVerifiedAt).toLocaleString() : 'Never'}</span>
              {lead.verification?.emailCheckedAt && <span>Email checked: {new Date(lead.verification.emailCheckedAt).toLocaleString()}</span>}
            </div>
          </div>
          
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="text-yellow-400 h-6 w-6" />
              <h3 className="text-lg font-bold">AI Outreach Ready</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              Generate a highly personalized cold email based on {lead.business?.name || 'this business'}'s industry, location, and website presence.
            </p>
            <Link to={`/app/leads/${lead._id}/email`}>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100">
                Generate Email Draft
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

