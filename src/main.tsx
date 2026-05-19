import React, { Component, useEffect, useState, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import type { DataInterface } from '@real-life-stack/data-interface';
import { ConnectorProvider, IncomingEventsProvider } from '@real-life-stack/toolkit';
import { App } from './App';
import { getConnector } from './lib/wot';
import './index.css';

function Wurzel() {
  const [connector, setConnector] = useState<DataInterface | null>(null);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getConnector()
      .then((c) => { if (alive) setConnector(c); })
      .catch((e) => { if (alive) setLadeFehler(e instanceof Error ? e.message : String(e)); });
    return () => { alive = false; };
  }, []);

  if (ladeFehler) {
    return (
      <div className="ladeschirm">
        <p className="ladeschirm-fehler">Der Garten konnte nicht starten: {ladeFehler}</p>
      </div>
    );
  }

  if (!connector) {
    return <div className="ladeschirm"><p>Garten wächst …</p></div>;
  }

  return (
    <BrowserRouter>
      <ConnectorProvider connector={connector}>
        <IncomingEventsProvider>
          <App />
        </IncomingEventsProvider>
      </ConnectorProvider>
    </BrowserRouter>
  );
}

class Fehlerwand extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Fehlerwand]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#a83232' }}>
          <h2 style={{ color: '#a83232' }}>Render-Fehler</h2>
          <p><strong>{this.state.error.message}</strong></p>
          <pre style={{ background: '#f6f6f0', padding: '1rem', overflow: 'auto', fontSize: '0.8rem' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Fehlerwand>
      <Wurzel />
    </Fehlerwand>
  </React.StrictMode>,
);
