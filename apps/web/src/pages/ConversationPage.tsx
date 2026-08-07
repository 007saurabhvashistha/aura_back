import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConnectionState, Room, createLocalAudioTrack } from 'livekit-client';
import { ApiClientError } from '../lib/api';
import { conversationApi } from '../lib/conversationApi';

type CallStatus = 'idle' | 'connecting' | 'connected' | 'ending' | 'ended' | 'failed';

export function ConversationPage() {
  const navigate = useNavigate();
  const roomRef = useRef<Room | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const [status, setStatus] = useState<CallStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState('Disconnected');

  useEffect(() => {
    return () => {
      void roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  async function startConversation() {
    setError(null);
    setStatus('connecting');
    try {
      const started = await conversationApi.start();
      conversationIdRef.current = started.conversation.id;

      const room = new Room({
        adaptiveStream: true,
      });

      room.on('connectionStateChanged', (state) => {
        if (state === ConnectionState.Connected) {
          setConnectionState('Connected');
          setStatus('connected');
        } else if (state === ConnectionState.Connecting) {
          setConnectionState('Connecting');
        } else if (state === ConnectionState.Disconnected) {
          setConnectionState('Disconnected');
        }
      });

      await room.connect(started.livekit.url, started.livekit.token);

      const track = await createLocalAudioTrack();
      await room.localParticipant.publishTrack(track);

      roomRef.current = room;
      setConnectionState('Connected');
      setStatus('connected');
    } catch (err) {
      setStatus('failed');
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Could not start conversation');
      }
      void roomRef.current?.disconnect();
      roomRef.current = null;
    }
  }

  async function endConversation() {
    const id = conversationIdRef.current;
    if (!id) {
      navigate('/', { replace: true });
      return;
    }
    setStatus('ending');
    setError(null);
    try {
      await conversationApi.end(id);
      await roomRef.current?.disconnect();
      roomRef.current = null;
      setConnectionState('Disconnected');
      setStatus('ended');
      conversationIdRef.current = null;
    } catch (err) {
      setStatus('failed');
      setError(err instanceof ApiClientError ? err.message : 'Could not end conversation');
    }
  }

  return (
    <main className="conversation-page">
      <header className="conversation-header">
        <h1 className="title">Aura</h1>
        <Link to="/" className="ghost">
          Back
        </Link>
      </header>

      <section className="conversation-card">
        <h2>Conversation</h2>
        <div className="conversation-indicator" aria-hidden="true" />
        <p className="conversation-state">
          {status === 'connected' ? 'Listening' : status === 'connecting' ? 'Connecting' : 'Ready'}
        </p>
        <p className="muted">
          {status === 'connected'
            ? "I'm listening..."
            : status === 'connecting'
              ? 'Setting up your secure voice session...'
              : 'Tap start to begin speaking with Aura.'}
        </p>

        <div className="conversation-controls">
          {(status === 'idle' || status === 'ended' || status === 'failed') && (
            <button type="button" onClick={startConversation}>
              Talk to Aura
            </button>
          )}

          {(status === 'connecting' || status === 'connected' || status === 'ending') && (
            <button type="button" className="danger" onClick={endConversation} disabled={status === 'ending'}>
              End Call
            </button>
          )}
        </div>

        <p className="muted">Connection: {connectionState}</p>
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}
