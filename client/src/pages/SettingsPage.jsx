import { Settings, User, Key, Sliders } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Button } from '../components/common/Button';

export const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="text-primary-600 h-7 w-7" /> Account Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account credentials, AI integrations, and outreach preferences.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.name || 'User'}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">{user?.role || 'USER'}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary-600" /> AI Provider Preferences
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">AI Provider</label>
              <input type="text" disabled value="Groq Llama-3.3-70b (Active)" className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cold Email Tone</label>
              <select className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-primary-500">
                <option value="professional">Professional & Direct</option>
                <option value="friendly">Friendly & Casual</option>
                <option value="persuasive">Persuasive Sales Angle</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};
