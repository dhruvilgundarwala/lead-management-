import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Copy, RefreshCw, Zap, Mail, ExternalLink, CheckCircle } from 'lucide-react';
import { getLead } from '../api/leads';
import { generateEmail, sendEmailApi } from '../api/email';
import { Button } from '../components/common/Button';

export const EmailGeneratorPage = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [context, setContext] = useState('They have no website and you want to build one for them. Mention their specific industry.');
  const [emailDraft, setEmailDraft] = useState(null);

  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => getLead(leadId)
  });

  const generateMutation = useMutation({
    mutationFn: () => generateEmail(leadId, context),
    onSuccess: (data) => {
      setEmailDraft(data.data);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to generate email');
    }
  });

  const sendMutation = useMutation({
    mutationFn: sendEmailApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsStats'] });
      alert(data.message || 'Email sent successfully! Lead status updated to CONTACTED.');
      navigate('/app/leads');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to send email');
    }
  });

  const lead = leadData?.data;

  const handleCopy = () => {
    if (!emailDraft) return;
    navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`);
    alert('Copied subject & body to clipboard!');
  };

  const handleSendViaApp = () => {
    if (!emailDraft) return;
    sendMutation.mutate({
      leadId,
      subject: emailDraft.subject,
      body: emailDraft.body,
      recipientEmail: lead?.contact?.email
    });
  };

  if (leadLoading) return <div className="p-8 text-slate-500">Loading lead details...</div>;
  if (!lead) return <div className="p-8 text-red-500">Lead not found</div>;

  const recipientEmail = lead.contact?.email || 'contact@example.com';
  const mailtoLink = emailDraft ? `mailto:${recipientEmail}?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}` : '#';

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <Link to={`/app/leads/${leadId}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Lead Details
      </Link>
      
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary-100 p-2.5 rounded-xl">
          <Zap className="h-7 w-7 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Outreach for {lead.business?.name}</h1>
          <p className="text-sm text-slate-500">Generate personalized cold emails designed to convert leads into clients.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary-600" /> Lead Contact Information
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><strong className="text-slate-900">Company:</strong> {lead.business?.name}</li>
              <li><strong className="text-slate-900">Industry:</strong> {lead.business?.industry || 'General'}</li>
              <li><strong className="text-slate-900">Location:</strong> {lead.location?.city || 'Unspecified'}</li>
              <li><strong className="text-slate-900">Email:</strong> {lead.contact?.email || <span className="text-amber-600 font-medium">No public email found</span>}</li>
              <li><strong className="text-slate-900">Website:</strong> {lead.contact?.website ? lead.contact.website : 'No website listed'}</li>
            </ul>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900">Customize AI Pitch Angle</h3>
            <textarea
              className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Provide context or pitch instructions to the AI..."
            />
            <Button 
              className="w-full gap-2" 
              onClick={() => generateMutation.mutate()}
              isLoading={generateMutation.isPending}
            >
              <Zap className="h-4 w-4" />
              Generate Draft with AI
            </Button>
          </div>
        </div>

        <div>
          {emailDraft ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject Line</span>
                  <button onClick={handleCopy} className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border border-slate-200">
                    <Copy className="h-3.5 w-3.5" /> Copy Text
                  </button>
                </div>
                <p className="font-semibold text-slate-900 text-base">{emailDraft.subject}</p>
              </div>

              <div className="p-5 flex-1 whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed bg-white">
                {emailDraft.body}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="flex gap-2">
                  <Button 
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white gap-2"
                    onClick={handleSendViaApp}
                    isLoading={sendMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                    Send via App & Update Status
                  </Button>
                </div>

                <div className="flex gap-2">
                  <a
                    href={mailtoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 py-2.5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open in Gmail / Email App
                  </a>
                  <Button 
                    variant="outline" 
                    className="text-xs bg-white"
                    onClick={() => generateMutation.mutate()} 
                    isLoading={generateMutation.isPending}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 border-dashed min-h-[400px]">
              <Mail className="h-12 w-12 mb-4 text-slate-300" />
              <h4 className="font-semibold text-slate-700 text-base">No Draft Generated Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">Click "Generate Draft with AI" on the left to write a personalized outreach email for this lead.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
