import { useRef, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import { useAppDependencies } from '@/app/dependencies';
import { useRestaurant } from '../hooks/useRestaurant';
import {
  parseCatalogImport,
  runCatalogImport,
  type CatalogImportMode,
  type CatalogImportPlan,
  type CatalogImportProgress,
  type CatalogImportResult,
} from '../import/catalogImport';

interface CatalogImportPageProps {
  portal: 'admin' | 'restaurant';
}

const progressLabel = (progress: CatalogImportProgress | null): string => {
  if (!progress) return '';
  if (progress.phase === 'done') return progress.label;
  const phase = progress.phase === 'restaurants' ? 'nhà hàng' : 'món ăn';
  return `Đang xử lý ${phase}: ${progress.label} (${progress.completed + 1}/${progress.total})`;
};

const ImportContent = () => {
  const { restaurant, menu, notifications } = useAppDependencies();
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('');
  const [plan, setPlan] = useState<CatalogImportPlan | null>(null);
  const [mode, setMode] = useState<CatalogImportMode>('create');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<CatalogImportProgress | null>(null);
  const [result, setResult] = useState<CatalogImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateSource = (value: string) => {
    try {
      const nextPlan = parseCatalogImport(value);
      setPlan(nextPlan);
      setError(null);
      setResult(null);
    } catch (caught) {
      setPlan(null);
      setResult(null);
      setError(caught instanceof Error ? caught.message : 'File import không hợp lệ');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setFileName(file.name);
    setSource(text);
    validateSource(text);
    event.target.value = '';
  };

  const handleImport = async () => {
    if (!plan || importing) return;
    const operationCount = plan.restaurants.length + plan.menuItems.length;
    const modeLabel = mode === 'create' ? 'tạo mới' : 'cập nhật record có id và tạo record mới';
    if (!window.confirm(`Sẽ ${modeLabel} tối đa ${operationCount} record. API không có transaction toàn file; tiếp tục?`)) return;

    setImporting(true);
    setError(null);
    setResult(null);
    setProgress(null);
    try {
      const nextResult = await runCatalogImport(
        plan,
        {
          createRestaurant: (data) => restaurant.createRestaurant(data),
          updateRestaurant: (id, data) => restaurant.updateRestaurant(id, data),
          createMenuItem: (data) => menu.createMenuItem(data),
          updateMenuItem: (id, data) => menu.updateMenuItem(id, data),
        },
        mode,
        setProgress,
      );
      setResult(nextResult);
      if (nextResult.errors.length) {
        notifications.error(`Import hoàn tất một phần: còn ${nextResult.errors.length} lỗi`);
      } else {
        notifications.success('Import nhà hàng và món ăn thành công');
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Import thất bại';
      setError(message);
      notifications.error(message);
    } finally {
      setImporting(false);
    }
  };

  const total = plan ? plan.restaurants.length + plan.menuItems.length : 0;
  const progressText = progressLabel(progress);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Data tools</p>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Import nhà hàng & món ăn</h1>
        <p className="mt-2 max-w-3xl text-gray-500 dark:text-gray-400">
          Chọn hoặc dán một file JSON catalog. Hệ thống sẽ kiểm tra trước, nối
          <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">restaurantKey</code>
          với ID backend rồi mới gọi lần lượt các API tạo/cập nhật.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200">
        Import nhiều lần ở chế độ <strong>Tạo mới</strong> sẽ tạo bản ghi trùng.
        Chế độ cập nhật chỉ dùng <code>id</code> có sẵn; không tự ghép theo tên hoặc địa chỉ.
      </div>

      <div className="rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <label htmlFor="catalog-import-source" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          JSON catalog nhà hàng và món ăn
        </label>
        <textarea
          id="catalog-import-source"
          aria-label="JSON catalog nhà hàng và món ăn"
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setPlan(null);
            setResult(null);
            setError(null);
          }}
          rows={12}
          placeholder={'Dán {"restaurants":[...],"menuItems":[...]} hoặc chọn file .json'}
          className="mt-3 w-full rounded-xl border border-gray-300 bg-white p-3 font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => validateSource(source)}
            disabled={!source.trim() || importing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Kiểm tra dữ liệu
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
          {fileName && <span className="text-xs text-gray-500 dark:text-gray-400">{fileName}</span>}
        </div>
      </div>

      {error && (
        <div role="alert" className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {plan && (
        <div className="rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preview dữ liệu</h2>
              <p role="status" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {plan.restaurants.length} nhà hàng · {plan.menuItems.length} món ăn · {total} request tối đa
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="catalog-import-mode"
                  checked={mode === 'create'}
                  onChange={() => setMode('create')}
                  disabled={importing}
                />
                Tạo mới
              </label>
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="catalog-import-mode"
                  checked={mode === 'update-existing'}
                  onChange={() => setMode('update-existing')}
                  disabled={importing}
                />
                Cập nhật record có id
              </label>
            </div>
          </div>

          {plan.warnings.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-700 dark:text-amber-300">
              {plan.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          )}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Nhà hàng mẫu</h3>
              <div className="mt-2 max-h-52 overflow-y-auto rounded-lg bg-gray-50 p-3 text-xs dark:bg-gray-900/50">
                {plan.restaurants.slice(0, 8).map((restaurant) => (
                  <p key={`${restaurant.key}-${restaurant.index}`} className="border-b border-gray-200 py-1.5 last:border-0 dark:border-gray-700">
                    {restaurant.request.name} <span className="text-gray-400">({restaurant.key})</span>
                  </p>
                ))}
                {plan.restaurants.length > 8 && <p className="pt-2 text-gray-500">… và {plan.restaurants.length - 8} nhà hàng khác</p>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Món ăn mẫu</h3>
              <div className="mt-2 max-h-52 overflow-y-auto rounded-lg bg-gray-50 p-3 text-xs dark:bg-gray-900/50">
                {plan.menuItems.slice(0, 8).map((item) => (
                  <p key={`${item.name}-${item.index}`} className="border-b border-gray-200 py-1.5 last:border-0 dark:border-gray-700">
                    {item.name} <span className="text-gray-400">({item.restaurantKey || `restaurantId=${item.restaurantId}`})</span>
                  </p>
                ))}
                {plan.menuItems.length > 8 && <p className="pt-2 text-gray-500">… và {plan.menuItems.length - 8} món khác</p>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing}
            className="mt-6 rounded-lg bg-primary px-5 py-3 font-bold text-white shadow-sm hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importing ? 'Đang import…' : 'Import dữ liệu vào backend'}
          </button>
        </div>
      )}

      {progressText && (
        <div role="status" aria-live="polite" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
          {progressText}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-border-light bg-white p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kết quả import</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Tạo nhà hàng" value={result.createdRestaurants} />
            <Stat label="Cập nhật nhà hàng" value={result.updatedRestaurants} />
            <Stat label="Tạo món" value={result.createdMenuItems} />
            <Stat label="Cập nhật món" value={result.updatedMenuItems} />
          </div>
          {result.errors.length > 0 ? (
            <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
              <p className="font-bold">Có {result.errors.length} lỗi; các request thành công không tự rollback.</p>
              <ul className="mt-2 max-h-56 list-disc space-y-1 overflow-y-auto pl-5">
                {result.errors.slice(0, 30).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-200">
              Import hoàn tất, không có lỗi.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/50">
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{value}</p>
  </div>
);

const CatalogImportPage = ({ portal }: CatalogImportPageProps) => {
  const { currentRestaurant } = useRestaurant();

  if (portal === 'admin') {
    return (
      <AdminLayout>
        <ImportContent />
      </AdminLayout>
    );
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <RestaurantHeader
          title="Import dữ liệu"
          subtitle="Nạp nhanh catalog nhà hàng và món ăn"
        />
        <div className="mx-auto w-full max-w-[1400px] flex-1 p-6 lg:p-8">
          <ImportContent />
        </div>
      </main>
    </div>
  );
};

export default CatalogImportPage;
