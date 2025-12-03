import { Upload, Scan } from 'lucide-react';
import { useRef, useState } from 'react';

interface UploadSectionProps {
  onImageSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export default function UploadSection({ onImageSelect, isAnalyzing }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 transform hover:scale-110 transition-transform duration-300 shadow-2xl">
            <Scan className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
            AI Product Defect Detection
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Advanced neural network analysis for detecting defects in windows, doors, frames, sliding systems, and glass panels
          </p>
        </div>

        <div
          className={`relative group ${isDragging ? 'scale-105' : ''} transition-transform duration-300`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 animate-gradient-shift" />

          <div className={`relative bg-slate-800/90 backdrop-blur-xl rounded-3xl p-12 border ${isDragging ? 'border-cyan-400' : 'border-slate-700'} transition-colors`}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isAnalyzing}
            />

            <div className="text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full mb-6 relative group-hover:scale-110 transition-transform duration-300">
                  <Upload className={`w-16 h-16 text-cyan-400 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                  {isAnalyzing && (
                    <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {isAnalyzing ? (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Analyzing Product...</h3>
                  <p className="text-gray-400">AI is processing your image</p>
                  <div className="mt-6 flex justify-center gap-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" />
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce delay-100" />
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Upload Product Image</h3>
                  <p className="text-gray-400 mb-8">
                    Drag & drop your product image here, or click to browse
                  </p>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold text-lg hover:from-blue-500 hover:to-cyan-500 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-cyan-500/50"
                  >
                    Select Image
                  </button>

                  <p className="text-sm text-gray-500 mt-6">
                    Supports: JPG, PNG, WebP • Max size: 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'AI Detection', desc: 'Advanced neural networks identify defects with precision' },
            { title: 'Bounding Boxes', desc: 'Visual markers highlight exact damage locations' },
            { title: 'PDF Reports', desc: 'Professional documentation ready to export' },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-white/20 rounded-full" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
