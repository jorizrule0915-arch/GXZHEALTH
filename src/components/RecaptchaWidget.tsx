import { useEffect, useRef, useState } from 'react';

type RecaptchaTheme = 'light' | 'dark';

interface RecaptchaWidgetProps {
  siteKey?: string;
  onVerify: (token: string | null) => void;
  resetKey?: number;
  theme?: RecaptchaTheme;
}

interface Grecaptcha {
  ready: (callback: () => void) => void;
  render: (
    container: HTMLElement,
    parameters: {
      sitekey: string;
      theme?: RecaptchaTheme;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    }
  ) => number;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let recaptchaScriptPromise: Promise<void> | null = null;

function loadRecaptchaScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (recaptchaScriptPromise) {
    return recaptchaScriptPromise;
  }

  recaptchaScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-recaptcha-script="true"]');

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaScript = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA.'));
    document.head.appendChild(script);
  });

  return recaptchaScriptPromise;
}

export default function RecaptchaWidget({
  siteKey,
  onVerify,
  resetKey = 0,
  theme = 'light',
}: RecaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onVerify(null);

    if (!siteKey) {
      setLoadError('Missing VITE_RECAPTCHA_SITE_KEY.');
      return;
    }

    let cancelled = false;
    setLoadError(null);

    loadRecaptchaScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.grecaptcha || widgetIdRef.current !== null) {
          return;
        }

        window.grecaptcha.ready(() => {
          if (cancelled || !containerRef.current || !window.grecaptcha || widgetIdRef.current !== null) {
            return;
          }

          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            callback: (token: string) => onVerify(token),
            'expired-callback': () => onVerify(null),
            'error-callback': () => onVerify(null),
          });
        });
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load reCAPTCHA.';
          setLoadError(message);
          onVerify(null);
        }
      });

    return () => {
      cancelled = true;
      onVerify(null);
    };
  }, [siteKey, theme, onVerify]);

  useEffect(() => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(widgetIdRef.current);
      onVerify(null);
    }
  }, [resetKey, onVerify]);

  return (
    <div>
      <div ref={containerRef} />
      {loadError && (
        <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#b91c1c' }}>
          {loadError}
        </p>
      )}
    </div>
  );
}
