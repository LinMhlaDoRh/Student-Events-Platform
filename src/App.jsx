import { supabase } from './supabaseClient'

function App() {
  const hasSupabaseConfig =
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
  const isSupabaseClientReady = Boolean(supabase)

  return (
    <main className="app-shell">
      <section className="intro">
        <p className="eyebrow">Richfield Durban</p>
        <h1>Student Events Platform</h1>
        <p className="summary">
          Phase 0 is ready: React, Vite, Supabase client wiring, and environment
          placeholders are in place.
        </p>
      </section>

      <section className="status-panel" aria-label="Project setup status">
        <h2>Setup Status</h2>
        <ul>
          <li>React + Vite app created</li>
          <li>Supabase client installed</li>
          <li>Environment variables kept out of Git</li>
          <li>{hasSupabaseConfig ? 'Supabase env detected' : 'Waiting for Supabase env values'}</li>
          <li>{isSupabaseClientReady ? 'Supabase client ready' : 'Supabase client paused safely'}</li>
        </ul>
      </section>
    </main>
  )
}

export default App
