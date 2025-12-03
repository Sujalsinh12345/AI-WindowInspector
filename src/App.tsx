import { useState } from 'react';
import { History, Home } from 'lucide-react';
import UploadSection from './components/UploadSection';
import ResultsSection from './components/ResultsSection';
import HistorySection from './components/HistorySection';
import { analyzeWindowImage } from './services/aiDetection';
import { supabase, CrackDetection } from './lib/supabase';

type View = 'upload' | 'results' | 'history';

function App() {
  const [currentView, setCurrentView] = useState<View>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detection, setDetection] = useState<CrackDetection | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setImageFile(file);

    try {
      const result = await analyzeWindowImage(file);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('window-images')
          .upload(`${Date.now()}_${file.name}`, file, {
            contentType: file.type,
            cacheControl: '3600',
          });

        let imageUrl = base64Image;

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('window-images')
            .getPublicUrl(uploadData.path);
          imageUrl = publicUrlData.publicUrl;
        }

        const { data: detectionData, error: dbError } = await supabase
          .from('crack_detections')
          .insert({
            image_url: imageUrl,
            image_name: file.name,
            detection_result: result,
            crack_detected: result.cracks.length > 0,
            window_type: result.window_type,
            confidence_score: result.overall_confidence,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setDetection(detectionData);
        setCurrentView('results');
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setDetection(null);
    setImageFile(null);
    setError(null);
    setCurrentView('upload');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white rounded" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                CrackDetect AI
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  currentView === 'upload'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Home className="w-4 h-4" />
                Analyze
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  currentView === 'history'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                History
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        {error && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-2xl animate-fade-in">
            {error}
          </div>
        )}

        {currentView === 'upload' && (
          <UploadSection onImageSelect={handleImageSelect} isAnalyzing={isAnalyzing} />
        )}

        {currentView === 'results' && detection && imageFile && (
          <ResultsSection detection={detection} imageFile={imageFile} onReset={handleReset} />
        )}

        {currentView === 'history' && <HistorySection />}
      </div>
    </div>
  );
}

export default App;
