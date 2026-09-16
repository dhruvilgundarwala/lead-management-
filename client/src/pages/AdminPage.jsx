import { ShieldCheck, Users, Server, Database } from 'lucide-react';

export const AdminPage = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-primary-600 h-7 w-7" /> Admin Control Panel
        </h1>
        <p className="text-slate-500 text-sm mt-1">System status, user management, and API health monitoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">API Server</div>
            <div className="text-xs text-green-600 font-medium">Operational (Port 5000)</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">MongoDB Database</div>
            <div className="text-xs text-green-600 font-medium">Connected</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">System Role</div>
            <div className="text-xs text-purple-600 font-medium">ADMIN Privileges</div>
          </div>
        </div>
      </div>
    </div>
  );
};
