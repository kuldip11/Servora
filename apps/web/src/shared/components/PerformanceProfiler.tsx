import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';

interface PerformanceProfilerProps {
  id: string;
  children: ReactNode;
}

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  _baseDuration,
  startTime,
  commitTime,
) => {
  if (actualDuration < 16) return;
  console.debug('[perf]', {
    id,
    phase,
    actualDuration: Number(actualDuration.toFixed(2)),
    commitDuration: Number((commitTime - startTime).toFixed(2)),
  });
};

/** Development-only commit profiling. Keep memo/useMemo decisions tied to measured slow commits. */
export function PerformanceProfiler({ id, children }: PerformanceProfilerProps) {
  if (!import.meta.env.DEV) return <>{children}</>;
  return <Profiler id={id} onRender={onRender}>{children}</Profiler>;
}
