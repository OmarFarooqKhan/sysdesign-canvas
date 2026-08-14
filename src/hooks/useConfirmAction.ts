import { useState } from 'react';

interface ConfirmRequest {
  message: string;
  run: () => void;
}

/** Local state for a single pending confirm-then-run action, replacing window.confirm().
 *  request() queues a message + callback; resolve() runs it and clears; cancel() just clears. */
export function useConfirmAction() {
  const [pending, setPending] = useState<ConfirmRequest | null>(null);

  const request = (message: string, run: () => void) => setPending({ message, run });
  const resolve = () => {
    pending?.run();
    setPending(null);
  };
  const cancel = () => setPending(null);

  return { pending, request, resolve, cancel };
}
