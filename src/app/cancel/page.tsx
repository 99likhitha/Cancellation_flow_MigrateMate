'use client';

import { useEffect, useState } from 'react';
import StepProgress from './StepProgress';
import Image from 'next/image';

type Variant = 'A' | 'B';
type Step = 'reason' | 'downsell' | 'final' | 'done';

export default function CancelPage() {
const [priceCents, setPriceCents] = useState<number | null>(null);

const formatUSD = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const discounted = (cents: number, v: 'A'|'B') => (v === 'B' ? Math.max(0, cents - 1000) : cents);


  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [cancellationId, setCancellationId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch('/api/cancel/session', { method: 'POST' });
      const data = await r.json();
      setPriceCents(typeof data.monthly_price === 'number' ? data.monthly_price : null);
      setVariant(data.variant);
      setCancellationId(data.cancellationId);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center">Loading…</div>;
  if (!variant || !cancellationId) return <div className="p-4 text-red-600">Init failed</div>;

  async function persistReason() {
    const trimmed = reason.trim();
    if (!trimmed) return;
    await fetch('/api/cancel/reason', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancellationId, reason: trimmed }),
    });
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-xl p-4 space-y-6">
        <Image
        src="/image1.jpg"         
        alt=""
        width={1200}
        height={480}
        className="w-full rounded-2xl"
        priority
    />
      <StepProgress step={step} />
        <div className="text-xs text-gray-500">Variant: <span className="font-mono">{variant}</span></div>

        {step === 'reason' && (
          <section className="space-y-3">
            <h1 className="text-2xl font-semibold">Why are you cancelling?</h1>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-32 rounded-xl border p-3"
              placeholder="Optional feedback (max 500 chars)"
              maxLength={500}
            />
            <div className="flex items-center gap-3">
            <Image
                src="/image2.png"    
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full"
            />
              <button
                className="rounded-xl bg-black px-4 py-2 text-white"
                onClick={async () => {
                  await persistReason();
                  setStep('downsell');
                }}
              >
                Continue
              </button>
              <span className="text-xs text-gray-400">{reason.length}/500</span>
            </div>
          </section>
        )}

        {step === 'downsell' && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Before you go…</h2>
            <p className="text-sm text-gray-600">
            {variant === 'B'
                ? priceCents != null
                    ? `Special offer: ${formatUSD(priceCents)} → ${formatUSD(discounted(priceCents, 'B'))} if you stay.`
                    : 'Special offer: $10 off your plan if you stay.'
                : 'Would you reconsider staying with us?'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="rounded-xl bg-black px-4 py-2 text-white"
                onClick={async () => {
                  await fetch('/api/cancel/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cancellationId, acceptedDownsell: true }),
                  });
                  setStep('done');
                }}
              >
                {variant === 'B' ? 'Accept $10 off & stay' : 'Stay subscribed'}
              </button>
              <button
                className="rounded-xl bg-gray-100 px-4 py-2"
                onClick={async () => {
                  await fetch('/api/cancel/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cancellationId, acceptedDownsell: false }),
                  });
                  setStep('final');
                }}
              >
                Continue to cancel
              </button>
            </div>
          </section>
        )}

        {step === 'final' && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Cancellation submitted</h2>
            <p className="text-sm text-gray-600">
              Your subscription is now marked as pending cancellation.
            </p>
            <button className="rounded-xl bg-black px-4 py-2 text-white" onClick={() => setStep('done')}>
              Done
            </button>
          </section>
        )}

        {step === 'done' && (
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">All set</h2>
            <p className="text-sm text-gray-600">Thanks for the feedback.</p>
          </section>
        )}
      </div>
    </main>
  );
}
