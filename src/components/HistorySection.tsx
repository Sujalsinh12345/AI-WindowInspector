import { useEffect, useState } from 'react';
import { History, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { supabase, CrackDetection } from '../lib/supabase';
import { generatePDFReport } from '../services/pdfGenerator';

export default function HistorySection() {
  const [detections, setDetections] = useState<CrackDetection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('crack_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setDetections(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4">
            <History className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Detection History
          </h2>
          <p className="text-gray-400">View all previous window analyses</p>
        </div>

        {detections.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No History Yet</h3>
            <p className="text-gray-500">Upload and analyze window images to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detections.map((detection) => (
              <div
                key={detection.id}
                className="bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="aspect-video bg-slate-900 relative overflow-hidden">
                  <img
                    src={detection.image_url}
                    alt={detection.image_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    {detection.crack_detected ? (
                      <div className="bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-semibold">Cracks Found</span>
                      </div>
                    ) : (
                      <div className="bg-green-500/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-semibold">No Issues</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-white font-semibold mb-2 truncate">{detection.image_name}</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Window Type</span>
                      <span className="text-cyan-400 capitalize">{detection.window_type || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Confidence</span>
                      <span className="text-white font-semibold">{detection.confidence_score || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Issues Found</span>
                      <span className="text-white font-semibold">{detection.detection_result.cracks.length}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    {new Date(detection.created_at).toLocaleString()}
                  </div>

                  <button
                    onClick={() => generatePDFReport(detection, detection.image_url)}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
