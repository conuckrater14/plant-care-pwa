import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getPlantById,
  waterPlant,
  fertilizePlant,
  prunePlant,
  repotPlant,
} from '../api';

const CARE_CONFIG = {
  water: {
    label: 'Water Plant',
    icon: '💧',
    gradient: 'linear-gradient(135deg, #16a34a, #15803d)',
    shadow: 'rgba(22,163,74,0.35)',
  },
  fertilize: {
    label: 'Fertilize',
    icon: '🌱',
    gradient: 'linear-gradient(135deg, #ca8a04, #a16207)',
    shadow: 'rgba(202,138,4,0.35)',
  },
  prune: {
    label: 'Prune',
    icon: '✂️',
    gradient: 'linear-gradient(135deg, #65a30d, #4d7c0f)',
    shadow: 'rgba(101,163,13,0.35)',
  },
  repot: {
    label: 'Repot',
    icon: '🪴',
    gradient: 'linear-gradient(135deg, #78716c, #57534e)',
    shadow: 'rgba(120,113,108,0.35)',
  },
};

const HISTORY_META = {
  watered: {
    bg: '#f0fdf4',
    ring: '#bbf7d0',
    text: '#15803d',
    dot: '#22c55e',
    icon: '💧',
  },
  fertilized: {
    bg: '#fefce8',
    ring: '#fde68a',
    text: '#a16207',
    dot: '#eab308',
    icon: '🌱',
  },
  pruned: {
    bg: '#f7fee7',
    ring: '#d9f99d',
    text: '#4d7c0f',
    dot: '#84cc16',
    icon: '✂️',
  },
  repotted: {
    bg: '#fafaf9',
    ring: '#e7e5e4',
    text: '#57534e',
    dot: '#a8a29e',
    icon: '🪴',
  },
};

export default function PlantDetail() {
  const { id } = useParams();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const loadPlant = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getPlantById(id);
      setPlant(data);
    } catch (err) {
      setError(err.message || 'Failed to load plant');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlant();
  }, [loadPlant]);

  const healthLabel = useMemo(() => {
    if (!plant) return '';
    if (plant.healthScore >= 80) return 'Healthy';
    if (plant.healthScore >= 50) return 'Fair';
    return 'Critical';
  }, [plant]);

  const healthCfg = useMemo(() => {
    if (!plant) return { bg: '#f8fafc', text: '#64748b', dot: '#94a3b8' };
    if (plant.healthScore >= 80) {
      return { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' };
    }
    if (plant.healthScore >= 50) {
      return { bg: '#fef9c3', text: '#a16207', dot: '#eab308' };
    }
    return { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' };
  }, [plant]);

  const handleAction = async (type) => {
    try {
      setActionLoading(type);
      setError('');

      const fns = {
        water: waterPlant,
        fertilize: fertilizePlant,
        prune: prunePlant,
        repot: repotPlant,
      };

      const updatedPlant = await fns[type](id, note);
      setPlant(updatedPlant);
      setNote('');
    } catch (err) {
      setError(err.message || `Failed to ${type} plant`);
    } finally {
      setActionLoading('');
    }
  };

  const pageShell = (children) => (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)' }}
    >
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );

  if (loading) {
    return pageShell(
      <div className="py-24 text-center text-slate-400">
        <div className="text-5xl">🌿</div>
        <p className="mt-3 text-sm">Loading plant details…</p>
      </div>
    );
  }

  if (!plant) {
    return pageShell(
      <>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-900"
        >
          ← Back to Dashboard
        </Link>
        <p className="mt-4 text-sm text-red-500">{error || 'Plant not found.'}</p>
      </>
    );
  }

  const statCards = [
    {
      label: 'Last Watered',
      value: plant.lastWatered
        ? new Date(plant.lastWatered).toLocaleDateString()
        : 'Not logged',
    },
    {
      label: 'Next Watering',
      value: plant.nextWatering
        ? new Date(plant.nextWatering).toLocaleDateString()
        : 'Not scheduled',
    },
    {
      label: 'Watering Frequency',
      value: `Every ${plant.wateringFrequency} days`,
    },
    {
      label: 'Last Fertilized',
      value: plant.lastFertilized
        ? new Date(plant.lastFertilized).toLocaleDateString()
        : 'Not logged',
    },
  ];

  return pageShell(
    <>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 transition hover:text-green-900"
      >
        ← Back to Dashboard
      </Link>

      <div className="mt-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        {plant.photo && (
          <img
            src={plant.photo}
            alt={plant.name}
            className="mb-6 h-56 w-full rounded-2xl object-cover"
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              {plant.name}
            </h1>
            <p className="mt-1 text-sm italic text-slate-400">
              {plant.species || 'Unknown species'}
            </p>
          </div>

          <span
            style={{ background: healthCfg.bg, color: healthCfg.text }}
            className="inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold"
          >
            <span
              style={{ background: healthCfg.dot }}
              className="h-2 w-2 rounded-full"
            />
            {healthLabel} {plant.healthScore}%
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div
            style={{ background: healthCfg.bg }}
            className="rounded-2xl p-4 lg:col-span-1"
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: healthCfg.text, opacity: 0.7 }}
            >
              Health Score
            </p>
            <p className="mt-2 text-xl font-bold" style={{ color: healthCfg.text }}>
              {plant.healthScore}%
            </p>
            <p className="text-sm font-medium" style={{ color: healthCfg.text }}>
              {healthLabel}
            </p>
          </div>

          {statCards.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-base font-bold text-slate-700">{value}</p>
            </div>
          ))}
        </div>

        {plant.notes && (
          <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-100">
            <p className="text-sm italic text-amber-800">📝 {plant.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-lg font-bold tracking-tight text-slate-800">
          Log Care Activity
        </h2>
        <p className="mt-0.5 text-sm text-slate-400">
          Add an optional note, then tap the care action.
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add an optional note…"
          rows="3"
          className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(CARE_CONFIG).map(([type, cfg]) => {
            const busy = actionLoading === type;
            const disabled = actionLoading !== '';

            return (
              <button
                key={type}
                onClick={() => handleAction(type)}
                disabled={disabled}
                style={
                  disabled
                    ? {}
                    : {
                        background: cfg.gradient,
                        boxShadow: `0 2px 10px ${cfg.shadow}`,
                      }
                }
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.97] disabled:opacity-50 ${
                  disabled ? 'bg-slate-300 shadow-none' : 'hover:opacity-90'
                }`}
              >
                <span>{cfg.icon}</span>
                {busy ? 'Saving…' : cfg.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            Care History
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {plant.careHistory?.length || 0} entries
          </span>
        </div>

        {!plant.careHistory || plant.careHistory.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl">🪴</div>
            <p className="mt-3 text-sm text-slate-400">
              No care logged yet. Start above!
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {[...plant.careHistory].reverse().map((entry, index) => {
              const meta = HISTORY_META[entry.type] || HISTORY_META.repotted;

              return (
                <div
                  key={`${entry.date}-${index}`}
                  style={{
                    background: meta.bg,
                    boxShadow: `inset 0 0 0 1px ${meta.ring}`,
                  }}
                  className="rounded-2xl px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        style={{
                          background: meta.bg,
                          color: meta.text,
                          boxShadow: `inset 0 0 0 1px ${meta.ring}`,
                        }}
                        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-base"
                      >
                        {meta.icon}
                      </span>

                      <div>
                        <p className="font-semibold capitalize" style={{ color: meta.text }}>
                          {entry.type}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {new Date(entry.date).toLocaleString()}
                        </p>
                        {entry.note && (
                          <p className="mt-1.5 text-sm italic text-slate-500">
                            "{entry.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        background: 'white',
                        color: meta.text,
                        borderColor: meta.ring,
                      }}
                      className="mt-0.5 flex-shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize"
                    >
                      {entry.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}