import { Upload, Scan, Link, Folder } from 'lucide-react';
import { useRef, useState } from 'react';
import BatchImageSelector from './BatchImageSelector';

interface UploadSectionProps {
  onImageSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export default function UploadSection({ onImageSelect, isAnalyzing }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [folderUrl, setFolderUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [showBatchSelector, setShowBatchSelector] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

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

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setIsLoadingUrl(true);
    try {
      let finalUrl = imageUrl;

      // Handle different cloud storage services
      if (imageUrl.includes('drive.google.com') && imageUrl.includes('/file/d/')) {
        // Google Drive
        const fileIdMatch = imageUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1];
          finalUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      } else if (imageUrl.includes('dropbox.com') && imageUrl.includes('/s/')) {
        // Dropbox sharing link
        finalUrl = imageUrl.replace('?dl=0', '?dl=1').replace(/$/, imageUrl.includes('?') ? '&dl=1' : '?dl=1');
      } else if (imageUrl.includes('dropbox.com') && imageUrl.includes('/scl/fi/')) {
        // Dropbox direct link
        finalUrl = imageUrl.replace('?rlkey=', '?raw=1&rlkey=');
      } else if (imageUrl.includes('sharepoint.com') || imageUrl.includes('onedrive.live.com') || imageUrl.includes('1drv.ms')) {
        // SharePoint/OneDrive - try to convert to download link
        if (imageUrl.includes('/_layouts/')) {
          // Already a download link
          finalUrl = imageUrl;
        } else {
          // Try to construct download URL
          finalUrl = imageUrl.replace('/redir?', '/download.aspx?').replace('onedrive.live.com/redir?', 'onedrive.live.com/download.aspx?');
        }
      }

      const response = await fetch(finalUrl, {
        headers: {
          'Accept': 'image/*',
        }
      });

      if (!response.ok) {
        // If thumbnail fails, try direct download for Google Drive
        if (imageUrl.includes('drive.google.com') && finalUrl.includes('thumbnail')) {
          const fileIdMatch = imageUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
          if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            const backupResponse = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);
            if (backupResponse.ok) {
              const blob = await backupResponse.blob();
              const file = new File([blob], `drive_image.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type });
              onImageSelect(file);
              setImageUrl('');
              setShowUrlInput(false);
              setIsLoadingUrl(false);
              return;
            }
          }
        }
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      // Validate that we got an image
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to a valid image file');
      }

      const file = new File([blob], `image_from_url.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type });
      onImageSelect(file);
      setImageUrl('');
      setShowUrlInput(false);
    } catch (error) {
      console.error('Error loading image from URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let userMessage = `Failed to load image from URL: ${errorMessage}`;

      if (imageUrl.includes('drive.google.com')) {
        userMessage += '\n\nFor Google Drive images:\n• Make sure the file is publicly shared ("Anyone with the link can view")\n• Copy the complete sharing link\n• Try using "Batch URLs" option instead';
      } else if (imageUrl.includes('dropbox.com')) {
        userMessage += '\n\nFor Dropbox images:\n• Use sharing links that end with ?dl=0\n• The app will convert them automatically\n• Make sure the link is accessible';
      } else if (imageUrl.includes('sharepoint.com') || imageUrl.includes('onedrive.live.com')) {
        userMessage += '\n\nFor OneDrive/SharePoint images:\n• Use direct download links when possible\n• Make sure the file is shared appropriately\n• Try different link formats if one doesn\'t work';
      }

      alert(userMessage + '\n\nPlease check the URL and try again.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoadingFolder(true);
    try {
      // For bulk URL processing, we don't need validation
      setShowFolderInput(false);
      setShowBatchSelector(true);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Failed. Please try again.');
    } finally {
      setIsLoadingFolder(false);
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

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-cyan-500 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-cyan-500/50 flex items-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Select Image
                    </button>

                    <button
                      onClick={() => {
                        setShowUrlInput(!showUrlInput);
                        setShowFolderInput(false); // Close the other form
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-pink-500/50 flex items-center gap-2"
                    >
                      <Link className="w-5 h-5" />
                      From URL
                    </button>

                    <button
                      onClick={() => {
                        setShowFolderInput(!showFolderInput);
                        setShowUrlInput(false); // Close the other form
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-500 hover:to-teal-500 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-teal-500/50 flex items-center gap-2"
                    >
                      <Folder className="w-5 h-5" />
                      Batch URLs
                    </button>
                  </div>

                  {showUrlInput && (
                    <form onSubmit={handleUrlSubmit} className="mt-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="Enter image URL or Google Drive sharing link..."
                          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                          disabled={isLoadingUrl}
                        />
                        <button
                          type="submit"
                          disabled={isLoadingUrl || !imageUrl.trim()}
                          className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isLoadingUrl ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Scan className="w-4 h-4" />
                          )}
                          Load
                        </button>
                      </div>
                    </form>
                  )}

                  {showFolderInput && (
                    <form onSubmit={handleFolderSubmit} className="mt-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={folderUrl}
                          onChange={(e) => setFolderUrl(e.target.value)}
                          placeholder="Optional: Enter folder URL or leave empty for bulk URL input..."
                          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400"
                          disabled={isLoadingFolder}
                        />
                        <button
                          type="submit"
                          disabled={isLoadingFolder || !folderUrl.trim()}
                          className="px-6 py-2 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-lg font-semibold hover:from-teal-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isLoadingFolder ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Folder className="w-4 h-4" />
                          )}
                          Process
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Note: Paste multiple image URLs (one per line) to analyze them one by one
                      </p>
                    </form>
                  )}

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

      {showBatchSelector && (
        <BatchImageSelector
          folderUrl={folderUrl || undefined}
          onImageSelect={(file) => {
            onImageSelect(file);
            setShowBatchSelector(false);
            setFolderUrl('');
          }}
          onClose={() => {
            setShowBatchSelector(false);
            setFolderUrl('');
          }}
        />
      )}
    </div>
  );
}
