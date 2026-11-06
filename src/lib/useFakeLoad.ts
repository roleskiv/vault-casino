import { useEffect, useState } from 'react'
/** Brief skeleton state so loading UI is visible in the prototype. */
export function useFakeLoad(ms = 500) {
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), ms); return () => clearTimeout(t) }, [ms])
  return loading
}
