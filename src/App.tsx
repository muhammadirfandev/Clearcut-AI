import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Trash2, 
  Download, 
  RefreshCw, 
  Image as ImageIcon, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';

// --- Types ---
interface ProcessingState {
  status: 'idle' | 'loading' | 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  error?: string;
}

// --- Components ---

const ComparisonSlider = ({ original, processed }: { original: string, processed: string }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-square w-full max-w-2xl mx-auto overflow-hidden rounded-2xl bg-slate-200 cursor-ew-resize mt-8 shadow-sm border border-slate-100"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* Background (Checkerboard for transparency) */}
      <div className="absolute inset-0 checkerboard" />

      {/* Processed (Bottom Layer) */}
      <img 
        src={processed} 
        alt="Processed" 
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Original (Top Layer with Clip) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={original} 
          alt="Original" 
          className="absolute inset-0 w-full h-full object-contain bg-slate-200"
        />
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
          <Maximize2 className="w-4 h-4 text-zinc-900 rotate-90" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 z-20 px-2 py-1 bg-slate-900/40 backdrop-blur-md rounded text-[10px] uppercase tracking-widest text-white font-medium select-none pointer-events-none">
        Original
      </div>
      <div className="absolute bottom-4 right-4 z-20 px-2 py-1 bg-slate-900/40 backdrop-blur-md rounded text-[10px] uppercase tracking-widest text-white font-medium select-none pointer-events-none text-right">
        Result
      </div>
    </div>
  );
};

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [state, setState] = useState<ProcessingState>({ status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    try {
      const originalUrl = URL.createObjectURL(file);
      setOriginalImage(originalUrl);
      setProcessedImage(null);
      setState({ status: 'processing', message: 'Analyzing image...', progress: 0 });

      const resultBlob = await removeBackground(file, {
        progress: (step, current, total) => {
          const percentage = Math.round((current / total) * 100);
          setState(prev => ({ 
            ...prev, 
            status: 'processing',
            message: `AI is working... (${step})`, 
            progress: percentage 
          }));
        }
      });

      const processedUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(processedUrl);
      setState({ status: 'completed' });
    } catch (error) {
      console.error(error);
      setState({ status: 'error', error: 'Failed to process image. Please try another one.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processImage(file);
  };

  const reset = () => {
    if (originalImage) URL.revokeObjectURL(originalImage);
    if (processedImage) URL.revokeObjectURL(processedImage);
    setOriginalImage(null);
    setProcessedImage(null);
    setState({ status: 'idle' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'clearcut-result.png';
    link.click();
  };

  return (
    <div className="min-h-screen selection:bg-indigo-600 selection:text-white bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">ClearCut<span className="text-indigo-600">AI</span></span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600">History</a>
          <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600">API Docs</a>
          <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300"></div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Workspace Area */}
        <div className="flex-1 p-8 md:p-12 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">Remove Background</h1>
            <p className="text-slate-500">100% automatically and <span className="font-medium text-slate-700">free</span>.</p>
          </div>

          {/* Action Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            {state.status === 'idle' || state.status === 'error' ? (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  flex-1 border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 shadow-sm
                  ${state.status === 'error' ? 'border-red-200 bg-red-50' : 'border-slate-300 bg-white hover:border-indigo-400'}
                `}
              >
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900">Upload an image</p>
                  <p className="text-sm text-slate-500 mt-1">or drag and drop a file here</p>
                </div>
                {state.status === 'error' && (
                  <p className="text-red-500 text-sm font-medium bg-red-100/50 px-4 py-1 rounded-full">{state.error}</p>
                )}
                <button className="mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 transition-all">
                  Choose File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm relative overflow-hidden h-full min-h-[400px]">
                <AnimatePresence mode="wait">
                  {state.status === 'processing' && (
                    <motion.div 
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                    >
                      <div className="relative w-24 h-24 mb-6">
                        <RefreshCw className="w-full h-full text-indigo-600 animate-spin opacity-20" />
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-slate-100"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={276}
                            strokeDashoffset={276 - (276 * (state.progress || 0)) / 100}
                            className="text-indigo-600 transition-all duration-500 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
                          {state.progress}%
                        </div>
                      </div>
                      <h3 className="font-bold text-xl mb-2 text-slate-900">{state.message}</h3>
                      <p className="text-slate-500 text-sm max-w-xs">
                        Hang tight! Our AI is working its magic in your browser.
                      </p>
                    </motion.div>
                  )}

                  {state.status === 'completed' && originalImage && processedImage && (
                    <motion.div 
                      key="completed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8 h-full"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">Result Ready</h3>
                            <p className="text-slate-500 text-xs font-medium">Original vs AI Result</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={reset}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Start Over
                          </button>
                          <button 
                            onClick={downloadImage}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all"
                          >
                            <Download className="w-4 h-4" /> Download Result
                          </button>
                        </div>
                      </div>

                      <ComparisonSlider original={originalImage} processed={processedImage} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Sample Images row from theme */}
          {state.status === 'idle' && (
            <div className="flex flex-col gap-3 mt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No image? Try one of these:</p>
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-slate-200 overflow-hidden border border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all">
                  <div className="w-full h-full bg-gradient-to-tr from-orange-200 to-orange-400"></div>
                </div>
                <div className="w-20 h-20 rounded-lg bg-slate-200 overflow-hidden border border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all">
                  <div className="w-full h-full bg-gradient-to-tr from-blue-200 to-blue-400"></div>
                </div>
                <div className="w-20 h-20 rounded-lg bg-slate-200 overflow-hidden border border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all">
                  <div className="w-full h-full bg-gradient-to-tr from-emerald-200 to-emerald-400"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Sidebar from theme */}
        <aside className="w-full lg:w-80 bg-white border-l border-slate-200 p-8 flex flex-col gap-8 shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Processing Settings</h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">High Resolution</label>
                <div className="w-9 h-5 bg-indigo-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Edge Smoothing</label>
                <div className="w-9 h-5 bg-slate-200 rounded-full relative">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-sm font-medium text-slate-700">Output Format</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>PNG (Transparent)</option>
                  <option>JPG (White BG)</option>
                  <option>WebP (Optimized)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Your History</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors">
                <div className="w-10 h-10 rounded bg-indigo-100 flex-shrink-0"></div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-900 truncate">portrait_final.png</p>
                  <p className="text-xs text-slate-500">2.4 MB • 2m ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded bg-amber-100 flex-shrink-0"></div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-900 truncate">product_shot_02.jpg</p>
                  <p className="text-xs text-slate-500">1.1 MB • 15m ago</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Local Processing</p>
            <p className="text-sm text-indigo-900 leading-snug">Your images never leave your browser. Fast, private, secure.</p>
          </div>
        </aside>
      </main>

      {/* Footer from original app adjusted to theme */}
      <footer className="border-t border-slate-200 p-8 text-center bg-white">
        <p className="text-slate-400 text-[10px] font-mono tracking-[0.3em] uppercase font-bold">
          Powered by ClearCut AI. Made by Stacknex Lab • 2026
        </p>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="space-y-4 p-6 rounded-3xl border border-transparent hover:border-slate-100 hover:bg-white transition-all">
    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shadow-inner">
      {icon}
    </div>
    <div className="space-y-1">
      <h4 className="font-bold text-lg tracking-tight text-slate-900">{title}</h4>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">{description}</p>
    </div>
  </div>
);
