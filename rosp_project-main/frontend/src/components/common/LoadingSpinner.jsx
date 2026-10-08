import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ label = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <Loader2 className="h-9 w-9 animate-spin text-brand-600" />
      <p className="text-slate-500 font-medium text-sm">{label}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export const FoodCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 animate-pulse">
    <div className="h-44 bg-slate-200 rounded-xl w-full" />
    <div className="space-y-2">
      <div className="h-5 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
    </div>
    <div className="h-10 bg-slate-200 rounded-xl w-full" />
  </div>
);

export default LoadingSpinner;
