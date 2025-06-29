import React, { useState, useRef } from 'react';
import { Camera, Upload, FileText, CheckCircle, Loader } from 'lucide-react';

interface UploadCardProps {
  onUpload: (file: File, base64data: string) => void; // Modified to pass base64data
  isProcessing?: boolean;
}

export const UploadCard: React.FC<UploadCardProps> = ({ onUpload, isProcessing = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64data = reader.result?.toString().split(',')[1]; // Get base64 string without data:image/jpeg;base64,

      if (base64data) {
        onUpload(file, base64data); // Pass file and base64data to parent
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      // Handle error, maybe show a message to the user
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-purple-400 bg-purple-50 scale-[1.02]'
            : isProcessing
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-purple-300 hover:bg-purple-25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isProcessing ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Loader className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <div>
              <p className="text-lg font-medium text-green-800">AI is processing your receipt...</p>
              <p className="text-sm text-green-600 mt-1">This usually takes a few seconds</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-purple-600" />
              </div>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Upload a receipt</p>
              <p className="text-sm text-gray-600 mt-1">
                Drag and drop or click to select from your device
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Choose File</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-white text-purple-600 px-6 py-3 rounded-lg font-medium border border-purple-200 hover:bg-purple-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        )}

        {isDragOver && (
          <div className="absolute inset-0 bg-purple-100/50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-12 h-12 text-purple-600 mx-auto mb-2 animate-bounce" />
              <p className="text-purple-700 font-medium">Drop your receipt here</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Supports JPG, PNG, PDF files up to 10MB
      </div>
    </div>
  );
};