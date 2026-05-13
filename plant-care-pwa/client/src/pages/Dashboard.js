import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlants, createPlant, deletePlant, waterPlant } from '../api';

function HealthBadge({ score = 0 }) {
  const cfg =
    score >= 80
      ? { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' }
      : score >= 50
      ? { bg: '#fef9c3', text: '#a16207', dot: '#eab308' }
      : { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' };

  const label = score >= 80 ? 'Healthy' : score >= 50 ? 'Fair' : 'Critical';

  return (
    <span
      style={{ background: cfg.bg, color: cfg.text }}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
    >
      <span style={{ background: cfg.dot }} className="h-1.5 w-1.5 rounded-full" />
      {label} {score}%
    </span>
  );
}

function StatusChip({ nextWatering }) {
  const due = new Date(nextWatering) <= new Date();
  return due ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-200">
      💧 Needs water
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
      ✓ On track
    </span>
  );
}

function WaterBar({ last, frequency }) {
  const now = new Date();
  const lastDate = new Date(last);
  const safeFrequency = Number(frequency) || 1;
  const daysSince = Math.max(0, Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)));
  const pct = Math.max(0, (1 - daysSince / safeFrequency) * 100);

  const gradient =
    pct > 40
      ? 'linear-gradient(90deg, #4ade80, #16a34a)'
      : pct > 10
      ? 'linear-gradient(90deg, #fde047, #d97706)'
      : 'linear-gradient(90deg, #fca5a5, #dc2626)';

  return (
    <div className="mt-4">
      <div className="mb-2 flex justify-between text-xs">
        <span className="font-medium text-slate-500">Water level</span>
        <span className="tabular-nums text-slate-400">
          {daysSince}d / {safeFrequency}d
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: gradient }}
        />
      </div>
    </div>
  );
}

const ACTIVITY_ICON = {
  watered: '💧',
  fertilized: '🌱',
  pruned: '✂️',
  repotted: '🪴',
};

function RecentActivity({ plants, onOpenPlant }) {
  const activities = useMemo(() => {
    return plants
      .flatMap((plant) =>
        (plant.careHistory || []).map((entry) => ({
          ...entry,
          plantId: plant._id,
          plantName: plant.name,
        }))
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [plants]);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
        Recent Activity
      </h3>
      {activities.length === 0 ? (
        <p className="text-sm leading-6 text-slate-400">
          No care activity yet. Water, fertilize, prune, or repot a plant to see it here.
        </p>
      ) : (
        <div className="space-y-1">
          {activities.map((item, index) => (
            <button
              key={`${item.plantId}-${item.date}-${index}`}
              onClick={() => onOpenPlant(item.plantId)}
              className="group w-full rounded-2xl px-3 py-2.5 text-left transition hover:bg-green-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{ACTIVITY_ICON[item.type] || '🌿'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700 group-hover:text-green-800">
                    {item.plantName}
                  </p>
                  <p className="text-xs capitalize text-slate-400">{item.type}</p>
                </div>
                <span className="whitespace-nowrap text-[11px] text-slate-300">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [plants, setPlants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [plantForm, setPlantForm] = useState({
    name: '',
    species: '',
    wateringFrequency: 7,
    fertilizerFrequency: 14,
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wateringId, setWateringId] = useState('');
  const [onlyNeedsWater, setOnlyNeedsWater] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const fetchPlants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getPlants();
      setPlants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load plants');
      setPlants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const res = await createPlant(plantForm);
      if (res?._id) {
        setPlants((prev) => [res, ...prev]);
        setPlantForm({
          name: '',
          species: '',
          wateringFrequency: 7,
          fertilizerFrequency: 14,
          notes: '',
        });
        setShowForm(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to create plant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      setError('');
      await deletePlant(id);
      setPlants((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete plant');
    }
  };

  const handleQuickWater = async (e, id) => {
    e.stopPropagation();
    try {
      setWateringId(id);
      setError('');
      const updatedPlant = await waterPlant(id);
      setPlants((prev) => prev.map((plant) => (plant._id === id ? updatedPlant : plant)));
    } catch (err) {
      setError(err.message || 'Failed to water plant');
    } finally {
      setWateringId('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const visiblePlants = useMemo(() => {
    return plants.filter((p) => {
      const matchesWater = !onlyNeedsWater || new Date(p.nextWatering) <= new Date();
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        p.name?.toLowerCase().includes(query) ||
        p.species?.toLowerCase().includes(query);

      return matchesWater && matchesSearch;
    });
  }, [plants, onlyNeedsWater, searchTerm]);

  const needsWater = plants.filter((p) => new Date(p.nextWatering) <= new Date()).length;

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100 transition';

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.15), rgba(255,255,255,0.08)),
          url('/background.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <header
        style={{
          background: 'linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)',
          boxShadow: '0 2px 20px rgba(20,83,45,0.25)',
        }}
        className="px-6 py-4 text-white"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl drop-shadow">🌿</span>
            <h1 className="text-xl font-bold tracking-tight">PlantCare</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {needsWater > 0 && (
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40">
                💧 {needsWater} need{needsWater > 1 ? 's' : ''} water
              </span>
            )}

            {installPrompt && (
              <button
                onClick={handleInstall}
                className="rounded-xl bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur transition hover:bg-white/20"
              >
                Install App
              </button>
            )}

            <button
              onClick={handleLogout}
              className="rounded-xl bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur transition hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="rounded-2xl px-4 py-3 backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.82)', boxShadow: '0 1px 12px rgba(0,0,0,0.07)' }}
          >
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">My Garden</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {plants.length} plant{plants.length !== 1 ? 's' : ''} total
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or species"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 sm:w-64"
              />
            </div>

            <button
              onClick={() => setOnlyNeedsWater((prev) => !prev)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                onlyNeedsWater
                  ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-200'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {onlyNeedsWater ? '💧 Showing: Needs water' : 'Filter: Needs water only'}
            </button>

            <button
              onClick={() => setShowForm((prev) => !prev)}
              style={{
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                boxShadow: '0 2px 12px rgba(22,163,74,0.35)',
              }}
              className="flex items-center gap-2 rounded-xl px-5 py-2 font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            >
              <span className="text-lg leading-none">+</span> Add Plant
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-7 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-slate-400">
              New Plant
            </h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <input
                className={inputCls}
                placeholder="Plant name *"
                value={plantForm.name}
                onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                required
              />
              <input
                className={inputCls}
                placeholder="Species (optional)"
                value={plantForm.species}
                onChange={(e) => setPlantForm({ ...plantForm, species: e.target.value })}
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Water every (days)
                </label>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  value={plantForm.wateringFrequency}
                  onChange={(e) =>
                    setPlantForm({ ...plantForm, wateringFrequency: +e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Fertilize every (days)
                </label>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  value={plantForm.fertilizerFrequency}
                  onChange={(e) =>
                    setPlantForm({ ...plantForm, fertilizerFrequency: +e.target.value })
                  }
                />
              </div>
              <input
                className={`${inputCls} sm:col-span-2`}
                placeholder="Notes (optional)"
                value={plantForm.notes}
                onChange={(e) => setPlantForm({ ...plantForm, notes: e.target.value })}
              />
              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                  className="flex-1 rounded-xl py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? 'Adding…' : 'Add Plant'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="text-4xl">🌿</div>
            <p className="mt-3 text-sm">Loading your garden…</p>
          </div>
        ) : visiblePlants.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-green-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="text-6xl">🪴</div>
            <h3 className="mt-4 text-xl font-semibold text-slate-700">
              {searchTerm.trim()
                ? 'No matching plants found'
                : onlyNeedsWater
                ? 'No plants need water right now'
                : 'No plants yet'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              {searchTerm.trim()
                ? 'Try a different plant name or species.'
                : onlyNeedsWater
                ? 'Turn off the filter to view all your plants.'
                : 'Start your garden by adding your first plant.'}
            </p>

            {searchTerm.trim() ? (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                className="mt-6 rounded-xl px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={() => (onlyNeedsWater ? setOnlyNeedsWater(false) : setShowForm(true))}
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                className="mt-6 rounded-xl px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
              >
                {onlyNeedsWater ? 'Show All Plants' : 'Add Your First Plant'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              {visiblePlants.map((p) => {
                const lastCare =
                  p.careHistory && p.careHistory.length > 0
                    ? [...p.careHistory].sort(
                        (a, b) => new Date(b.date) - new Date(a.date)
                      )[0]
                    : null;

                const isWatering = wateringId === p._id;

                return (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/plant/${p._id}`)}
                    className="group cursor-pointer rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-green-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <StatusChip nextWatering={p.nextWatering} />
                      <HealthBadge score={p.healthScore} />
                    </div>

                    <h3 className="mt-3 truncate text-[17px] font-bold tracking-tight text-slate-800">
                      {p.name}
                    </h3>
                    {p.species && (
                      <p className="truncate text-xs italic text-slate-400">{p.species}</p>
                    )}

                    <WaterBar last={p.lastWatered} frequency={p.wateringFrequency} />

                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>
                        Next water:{' '}
                        <span className="font-semibold text-green-600">
                          {new Date(p.nextWatering).toLocaleDateString()}
                        </span>
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, p._id)}
                        className="rounded-lg px-2 py-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>

                    {lastCare && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Last care: <span className="capitalize">{lastCare.type}</span> on{' '}
                        {new Date(lastCare.date).toLocaleDateString()}
                      </p>
                    )}

                    <div className="mt-4 border-t border-slate-50 pt-4">
                      <div className="mb-3 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {p.careHistory?.length || 0} care logs
                        </span>
                        <span className="font-semibold text-green-600 group-hover:underline">
                          View details →
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleQuickWater(e, p._id)}
                        disabled={isWatering}
                        style={
                          isWatering
                            ? {}
                            : { background: 'linear-gradient(135deg, #bbf7d0, #86efac)' }
                        }
                        className="w-full rounded-2xl py-2.5 text-sm font-semibold text-green-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isWatering ? '💧 Watering…' : '💧 Quick Water'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <RecentActivity
              plants={plants}
              onOpenPlant={(plantId) => navigate(`/plant/${plantId}`)}
            />
          </div>
        )}
      </main>
    </div>
  );
}