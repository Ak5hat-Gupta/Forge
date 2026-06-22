"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
  loading?: boolean;
}

export function UploadZone({ onFile, loading }: Props) {
  const onDrop = useCallback((files: File[]) => {
    if (files[0]) onFile(files[0]);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200",
        isDragActive
          ? "border-violet bg-violet/10 shadow-glow-violet"
          : "border-line bg-surface/30 hover:border-violet/60 hover:bg-surface/50",
        loading && "pointer-events-none opacity-50"
      )}
    >
      <input {...getInputProps()} />
      <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet via-magenta to-cyan text-white shadow-[0_8px_30px_-8px_rgba(168,85,247,0.7)]">
        <Upload size={26} />
      </span>
      <p className="text-sm font-medium">
        {isDragActive ? "Drop your file here" : "Drag & drop a CSV or Excel file"}
      </p>
      <p className="mt-1 text-xs text-ink-muted">or click to browse (max 10MB)</p>
    </div>
  );
}
