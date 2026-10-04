import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import {
  Sparkles,
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  Send,
  Loader2,
  BookOpen,
  BrainCircuit,
  AlertCircle
} from 'lucide-react';

interface AiStudyAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject?: string;
}

export const AiStudyAssistantModal: React.FC<AiStudyAssistantModalProps> = ({
  isOpen,
  onClose,
  currentSubject,
}) => {
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState(currentSubject || 'General Study');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultAnswer, setResultAnswer] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setImageMimeType(file.type);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageMimeType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() && !selectedImage) {
      setErrorMessage('Please type a question or upload a photo of your study material.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResultAnswer(null);

    try {
      const res = await geminiService.analyzeStudyDoubt({
        questionText: question.trim(),
        imageBase64: selectedImage || undefined,
        imageMimeType: imageMimeType || undefined,
        subjectContext: subject,
      });
      setResultAnswer(res.answer);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to analyze doubt. Ensure GEMINI_API_KEY is configured in AI Studio.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-700/50 text-purple-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">
                  AI Study Tutor & Image Solver
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  gemini-3.1-pro · High Thinking
                </span>
              </div>
              <span className="text-xs text-neutral-400">
                Snap textbook problems, handwritten notes, or code doubts
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Strict Boundary Disclaimer */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-[11px] text-neutral-400">
            💡 <strong>Study Squad Protocol:</strong> Your daily study topics and points are always decided manually by the 4 friends. This tool is solely for clarifying difficult homework concepts and breaking down uploaded photos.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Subject Context
                </label>
                <input
                  type="text"
                  placeholder="e.g. DSA, C Programming, Discrete Math"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Your Question or Concept Doubt
              </label>
              <textarea
                rows={3}
                placeholder="Ask about a problem, algorithm, theorem, code bug, or explain what's in your photo..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg bg-neutral-950 border border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Photo / Image Upload Area */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Attach Photo of Textbook, Homework, or Notes (Optional)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {!selectedImage ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-4 border border-dashed border-neutral-700 hover:border-purple-500 rounded-xl bg-neutral-950/40 text-neutral-400 hover:text-purple-300 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-neutral-400" />
                  <span className="text-xs font-medium">Click to upload photo or take screenshot</span>
                  <span className="text-[10px] text-neutral-500">Supports PNG, JPG, WebP</span>
                </button>
              ) : (
                <div className="relative rounded-xl border border-neutral-700 overflow-hidden bg-neutral-950 p-2">
                  <img
                    src={selectedImage}
                    alt="Study material"
                    className="max-h-48 rounded-lg object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-neutral-900/90 text-neutral-300 hover:text-rose-400 border border-neutral-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing with High Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Explain Step-by-Step</span>
                </>
              )}
            </button>
          </form>

          {/* Result Output */}
          {resultAnswer && (
            <div className="p-5 rounded-xl bg-neutral-950 border border-purple-900/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Academic Explanation</span>
              </div>
              <div className="prose prose-invert prose-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {resultAnswer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
