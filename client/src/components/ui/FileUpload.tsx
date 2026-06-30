import { useCallback, useState } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  error?: string;
  currentFile?: string;
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
  maxSizeMB = 5,
  label = 'Upload Document',
  error,
  currentFile,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

  const validateAndSelect = useCallback(
    (file: File) => {
      setFileError(null);

      if (!allowedTypes.includes(file.type)) {
        setFileError('Invalid file type. Allowed: PDF, JPEG, PNG, WebP');
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setFileError(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      setSelectedFile(file);
      onFileSelect(file);
    },
    [maxSizeMB, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const removeFile = () => {
    setSelectedFile(null);
    setFileError(null);
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
    return <Image className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}

      {selectedFile ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
          {getFileIcon(selectedFile.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center gap-2 p-8
            rounded-xl border-2 border-dashed cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100'
            }
          `}
        >
          <Upload
            className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Drag & drop your file here, or{' '}
              <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, JPEG, PNG, WebP • Max {maxSizeMB}MB
            </p>
          </div>
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      )}

      {currentFile && !selectedFile && (
        <p className="text-xs text-emerald-600">✓ Document already uploaded</p>
      )}

      {(fileError || error) && (
        <p className="text-sm text-red-600" role="alert">
          {fileError || error}
        </p>
      )}
    </div>
  );
}
