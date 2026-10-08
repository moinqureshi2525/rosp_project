import React, { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw, Info, Cpu, CheckCircle2, Sparkles } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { canteenAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminPredictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await canteenAPI.getPredictions();
      setPredictions(data);
    } catch (err) {
      console.error('Failed to load predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleGeneratePredictions = async () => {
    setGenerating(true);
    setSuccessMessage(null);
    try {
      const freshPredictions = await canteenAPI.generatePredictions();
      setPredictions(freshPredictions);
      setSuccessMessage('ML demand predictions updated successfully for tomorrow!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate predictions:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Running ML demand prediction engine..." />;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Trigger Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200 mb-1">
            <Cpu size={14} strokeWidth={2.5} /> ML Random Forest Regressor Model
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">
            Food Demand Prediction & Prep Recommendation 🤖
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            AI-driven daily requirement forecasts to optimize food prep and eliminate canteen wastage
          </p>
        </div>

        <button
          onClick={handleGeneratePredictions}
          disabled={generating}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-lg shadow-brand-600/30 hover:scale-102 disabled:opacity-50"
        >
          <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Running ML Engine...' : 'Generate New Prediction'}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      {/* Explanation Box */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
          <Info size={18} /> Model Methodology & Buffer Notice
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          Demand prediction uses historical canteen sales data, day-of-week consumption patterns, and recent sales velocity to estimate tomorrow's food requirements.
        </p>
        <p className="text-slate-400 text-xs italic">
          * <strong>Recommended Preparation Quantity</strong> includes a small safety buffer (approx. 10-15%) to prevent unexpected stockouts while minimizing food wastage. Note that AI predictions represent statistical estimations based on historical trends and are not guaranteed to be 100% accurate.
        </p>
      </div>

      {/* Predictions Comparison Recharts Visualization */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-lg text-slate-900">
          Predicted Demand vs Recommended Preparation Quantity
        </h3>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="food_item_name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip formatter={(val) => [`${val} units`]} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="predicted_demand" name="Predicted Demand" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="recommended_prep_qty" name="Recommended Prep (with Safety Buffer)" fill="#ea580c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-lg text-slate-900">
          Detailed Dish Requirement Forecasts
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase border-b border-slate-100">
              <tr>
                <th className="p-4">Food Item</th>
                <th className="p-4">Prediction Date</th>
                <th className="p-4">Predicted Demand</th>
                <th className="p-4">Recommended Preparation</th>
                <th className="p-4">Confidence Score</th>
                <th className="p-4">ML Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {predictions.map((pred) => (
                <tr key={pred.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{pred.food_item_name}</td>
                  <td className="p-4 text-xs font-semibold text-slate-600">{pred.prediction_date}</td>
                  <td className="p-4 font-semibold text-blue-600">{pred.predicted_demand} units</td>
                  <td className="p-4 font-bold text-brand-600 text-base">
                    {pred.recommended_prep_qty} units
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      {(pred.confidence_score * 100).toFixed(0)}% Score
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400 font-mono">{pred.model_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPredictions;
