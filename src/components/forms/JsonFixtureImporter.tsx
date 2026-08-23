import { useRef, useState } from 'react';
import { parseJsonFixture, type JsonFixtureRecord } from '@/utils/jsonFixture';

interface JsonFixtureImporterProps {
  label: string;
  onImport: (fixture: JsonFixtureRecord) => void;
}

const JsonFixtureImporter = ({ label, onImport }: JsonFixtureImporterProps) => {
  const [source, setSource] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const applySource = (value: string) => {
    try {
      onImport(parseJsonFixture(value));
      setMessage('Đã nạp JSON vào form. Kiểm tra lại trước khi lưu.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'JSON fixture không hợp lệ');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setSource(text);
    applySource(text);
    event.target.value = '';
  };

  return (
    <details className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-primary">
        Nạp JSON fixture
      </summary>
      <div className="mt-4 space-y-3">
        <label htmlFor={`${label}-json`} className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </label>
        <textarea
          id={`${label}-json`}
          aria-label={label}
          value={source}
          onChange={(event) => setSource(event.target.value)}
          rows={5}
          placeholder={'Dán JSON hoặc chọn file .json…'}
          className="w-full rounded-lg border border-gray-300 bg-white p-3 font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applySource(source)}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Nạp vào form
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Chọn file JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleFileChange(event)}
            className="hidden"
          />
        </div>
        {message && (
          <p role="status" className="text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>
    </details>
  );
};

export default JsonFixtureImporter;
