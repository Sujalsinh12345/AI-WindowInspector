import { useRef, useEffect, useState } from 'react';
import { Download, RotateCcw, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { DefectDetection } from '../lib/supabase';
import { generatePDFReport } from '../services/pdfGenerator';

interface ResultsSectionProps {
  detection: DefectDetection;
  imageFile: File;
  onReset: () => void;
}

export default function ResultsSection({ detection, imageFile, onReset }: ResultsSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageDataUrl(dataUrl);

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        detection.detection_result.cracks.forEach((crack) => {
          const x = (crack.location.x / 100) * img.width;
          const y = (crack.location.y / 100) * img.height;
          const width = (crack.location.width / 100) * img.width;
          const height = (crack.location.height / 100) * img.height;

          const color = crack.severity === 'severe' ? '#ef4444' : crack.severity === 'moderate' ? '#f59e0b' : '#10b981';

          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, width, height);

          ctx.fillStyle = color;
          ctx.font = 'bold 16px Arial';
          ctx.fillText(`${crack.type.toUpperCase()} (${crack.confidence}%)`, x, y - 8);

          ctx.fillStyle = `${color}33`;
          ctx.fillRect(x, y, width, height);
        });
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(imageFile);
  }, [detection, imageFile]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `defect_detection_${detection.id.slice(0, 8)}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleGeneratePDF = () => {
    generatePDFReport(detection, imageDataUrl);
  };

  const hasDefects = detection.crack_detected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Analysis Complete
          </h2>
          <p className="text-gray-400">AI-powered detection results with visual markers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className={`bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border ${hasDefects ? 'border-red-500/50' : 'border-green-500/50'}`}>
            <div className="flex items-center gap-4 mb-4">
              {hasDefects ? (
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">Defect Status</h3>
                <p className={`text-2xl font-bold ${hasDefects ? 'text-red-400' : 'text-green-400'}`}>
                  {hasDefects ? 'Defects Found' : 'No Defects'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
            <div className="mb-2">
              <h3 className="text-sm text-gray-400">Product Type</h3>
              <p className="text-xl font-bold text-cyan-400 capitalize">
                {detection.window_type || 'Unknown'}
              </p>
            </div>
            <div>
              <h3 className="text-sm text-gray-400">Confidence Score</h3>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: `${detection.confidence_score || 0}%` }}
                  />
                </div>
                <span className="text-xl font-bold text-white">{detection.confidence_score || 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
            <h3 className="text-sm text-gray-400 mb-2">Defects Detected</h3>
            <p className="text-4xl font-bold text-white mb-2">{detection.detection_result.cracks.length}</p>
            <p className="text-sm text-gray-400">
              {detection.detection_result.cracks.length === 0 ? 'No defects found' : 'Marked with bounding boxes'}
            </p>
          </div>
        </div>

        {hasDefects && (
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Detected Defects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detection.detection_result.cracks.map((crack, idx) => (
                <div key={idx} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold capitalize">{crack.type}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      crack.severity === 'severe' ? 'bg-red-500/20 text-red-400' :
                      crack.severity === 'moderate' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {crack.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Confidence: {crack.confidence}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">AI Analysis</h3>
          <p className="text-gray-300 leading-relaxed">{detection.detection_result.analysis}</p>
        </div>

        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Annotated Image</h3>
          <div className="relative rounded-xl overflow-hidden bg-slate-900">
            <canvas ref={canvasRef} className="w-full h-auto" />
          </div>
          <p className="text-sm text-gray-400 mt-4">
            {hasDefects ? 'Colored bounding boxes indicate detected defects and damage' : 'No defects detected in this image'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={downloadImage}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-cyan-500 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Image
          </button>

          <button
            onClick={handleGeneratePDF}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Generate PDF Report
          </button>

          <button
            onClick={onReset}
            className="px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Analyze Another
          </button>
        </div>
      </div>
    </div>
  );
}
