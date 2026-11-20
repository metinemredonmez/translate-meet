import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { config } from '@/config';
import { createRealtimeToken } from '@/api/endpoints';
import { ApiError } from './apiClient';
import { emptyCaptions, reduceCaptions, type CaptionsState } from './captions';
import { RealtimeSession, resolveConverseUrl, type ConnectionState, type ServerMessage } from './realtime';

type Action = { kind: 'msg'; msg: ServerMessage; langA: string; langB: string } | { kind: 'reset' };

function reducer(state: CaptionsState, a: Action): CaptionsState {
  if (a.kind === 'reset') return emptyCaptions;
  return reduceCaptions(state, a.msg, { langA: a.langA, langB: a.langB });
}

export function useConverse(langA: string, langB: string) {
  const [state, setState] = useState<ConnectionState>('idle');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [captions, dispatch] = useReducer(reducer, emptyCaptions);
  const langsRef = useRef({ langA, langB });
  langsRef.current = { langA, langB };

  const sessionRef = useRef<RealtimeSession | null>(null);
  if (!sessionRef.current) {
    sessionRef.current = new RealtimeSession({
      onState: (s, detail) => {
        setState(s);
        if (detail?.code !== undefined && s !== 'ready' && s !== 'connecting') setErrorCode(String(detail.code));
      },
      onMessage: (msg) => dispatch({ kind: 'msg', msg, ...langsRef.current }),
    });
  }

  useEffect(() => () => sessionRef.current?.close(), []);

  const connect = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    setErrorCode(null);
    dispatch({ kind: 'reset' });
    setState('connecting');
    try {
      const { langA: source_lang, langB: target_lang } = langsRef.current;
      const tok = await createRealtimeToken({ source_lang, target_lang });
      session.start({
        url: resolveConverseUrl(tok.gateway_url, config.gatewayUrl),
        token: tok.token,
        source_lang,
        target_lang,
        mode: 'two_way',
      });
    } catch (e) {
      if (e instanceof ApiError) {
        setErrorCode(e.code);
        setState(
          e.status === 401 ? 'auth_error' : e.status === 402 ? 'quota_exhausted' : e.code === 'network' ? 'network_lost' : 'error',
        );
      } else {
        setState('error');
      }
    }
  }, []);

  const disconnect = useCallback(() => sessionRef.current?.close(), []);
  const sendText = useCallback((text: string) => sessionRef.current?.sendText(text) ?? false, []);

  return { state, errorCode, captions, connect, disconnect, sendText };
}
