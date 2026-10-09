import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <div className="p-4 rounded-2xl bg-error-container/20 border border-error/30 text-error shadow-xl">
        <ShieldAlert className="w-12 h-12" />
      </div>

      <h1 className="text-2xl font-bold font-serif text-on-surface">403 – Access Forbidden</h1>
      <p className="text-sm text-on-surface-variant max-w-md">
        Your administrative role does not possess the statutory permission required to access this resource. All unauthorized access attempts are recorded in the immutable audit log.
      </p>

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-4 py-2 mt-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary text-sm font-semibold transition-all border border-surface-container-highest shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Command Dashboard
      </button>
    </div>
  );
};
