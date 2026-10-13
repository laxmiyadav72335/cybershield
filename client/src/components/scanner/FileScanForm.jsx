import { useRef, useState } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

export const MAX_FILE_BYTES = 32 * 1024 * 1024;

const prettyBytes = (n) => {
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i ? 1 : 0)} ${u[i]}`;
};

/**
 * File drop zone. The file never leaves the browser until VirusTotal says it
 * has not seen its SHA-256 before (see Scanner.handleFileScan).
 */
export default function FileScanForm({ onScan, disabled }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setFile(null);
      return setError('File is larger than 32 MB. VirusTotal\'s free upload limit is 32 MB.');
    }
    if (f.size === 0) {
      setFile(null);
      return setError('That file is empty.');
    }
    setError('');
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) return setError('Choose a file first.');
        onScan(file);
      }}
      className="space-y-4"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-label="Drop a file here or click to choose"
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? 'border-cyber-cyan bg-cyber-cyan/10' : 'border-white/15 bg-bg-900/40 hover:border-cyber-cyan/50'
        }`}
      >
        <input ref={inputRef} type="file" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} disabled={disabled} />
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cyber-cyan/15 text-cyber-cyan ring-1 ring-cyber-cyan/40">
          <Icon name="file" className="h-7 w-7" />
        </span>
        {file ? (
          <>
            <p className="mt-4 max-w-full truncate font-medium text-white">{file.name}</p>
            <p className="mt-1 text-xs text-slate-400">{prettyBytes(file.size)} · {file.type || 'unknown type'}</p>
          </>
        ) : (
          <>
            <p className="mt-4 font-medium text-white">Drop a file here, or click to choose</p>
            <p className="mt-1 text-xs text-slate-400">APK, EXE, PDF, DOCX, ZIP… up to 32 MB</p>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <Icon name="alert" className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-slate-500">
          <span className="text-cyber-cyan">Privacy:</span> we hash the file in your browser first and only upload it if
          VirusTotal has never seen it. Our server does not store file bytes; unknown files are sent to VirusTotal for analysis.
        </p>
        <Button type="submit" size="lg" disabled={disabled || !file} className="sm:w-40">
          <Icon name="scan" className="h-5 w-5" />
          Scan file
        </Button>
      </div>
    </form>
  );
}
