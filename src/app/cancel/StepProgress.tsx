'use client';

export type FlowStep = 'reason' | 'downsell' | 'final' | 'done';

export default function StepProgress({ step }: { step: FlowStep }) {
  const order: FlowStep[] = ['reason', 'downsell', 'final', 'done'];
  const current = order.indexOf(step);

  return (
    <div className="flex items-center gap-2 mb-6">
      {order.map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`h-2 w-10 rounded-full transition-colors ${
              i <= current ? 'bg-black' : 'bg-gray-200'
            }`}
          />
          {i < order.length - 1 && <div className="w-2" />}
        </div>
      ))}
    </div>
  );
}
