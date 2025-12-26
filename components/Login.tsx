
import React, { useState } from 'react';
import { User, PlatformSettings, UserRole } from '../types';
import { supabase, getCurrentProfile, generateShortId } from '../database';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';

interface LoginProps {
  onLogin: (user: User) => void;
  platformSettings: PlatformSettings;
}

const Login: React.FC<LoginProps> = ({ onLogin, platformSettings }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const shortId = generateShortId();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
                name: name,
                short_id: shortId,
                status: 'pending' 
            }
          }
        });

        if (signUpError) throw signUpError;
        
        if (data.user) {
          // Forza il logout per prevenire auto-login su account non approvato
          await supabase.auth.signOut();
          
          setError('REGISTRAZIONE COMPLETATA! Il tuo account è ora in fase di analisi. Riceverai una mail entro 24-48 ore se il tuo profilo sarà accettato.');
          setIsRegistering(false);
          setName('');
          setEmail('');
          setPassword('');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Recuperiamo il profilo reale dal database per controllare lo stato aggiornato
          const profile = await getCurrentProfile(data.user.id);
          
          if (profile) {
            // Logica rigorosa: solo 'active' può entrare
            if (profile.status === 'active') {
                if (profile.isBlocked) {
                    setError('ACCOUNT BLOCCATO: Il tuo profilo è stato disabilitato. Contatta l\'assistenza.');
                    await supabase.auth.signOut();
                } else {
                    onLogin(profile);
                }
            } else if (profile.status === 'pending') {
                setError('ACCESSO NEGATO: Il tuo account è ancora in fase di analisi (24-48h). Verrai avvisato via email.');
                await supabase.auth.signOut();
            } else {
                setError('ACCOUNT DISABILITATO o RIFIUTATO. Contatta l\'amministratore.');
                await supabase.auth.signOut();
            }
          } else {
             setError('ERRORE CRITICO: Profilo non trovato. Riprova più tardi.');
             await supabase.auth.signOut();
          }
        }
      }
    } catch (err: any) {
      let msg = err.message || 'Errore durante l\'autenticazione.';
      if (msg.includes("Invalid login credentials")) msg = "Credenziali non valide.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  
  const logoStyle = {
      width: `${platformSettings.logo_login_width || 128}px`,
      height: `${platformSettings.logo_login_height || 128}px`,
      objectFit: 'contain' as const,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-surface p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center mb-8">
            <div className="flex flex-col items-center justify-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-secondary">MWS</h1>
                {platformSettings.platform_logo && (
                    <img 
                        src={platformSettings.platform_logo} 
                        alt="Logo Piattaforma" 
                        style={logoStyle}
                    />
                )}
            </div>
            <h2 className="text-2xl font-bold text-primary mt-2">
              {isRegistering ? 'Crea Account' : 'Accedi'}
            </h2>
            <p className="text-gray-500 mt-1">Piattaforma Affiliate 2.0</p>
        </div>
        <form onSubmit={handleAuth}>
          {isRegistering && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome e Cognome</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                required
              />
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 top-1 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          {error && (
            <div className={`p-4 rounded-lg text-sm mb-6 text-center font-bold border ${
                error.includes('REGISTRAZIONE COMPLETATA') 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
                {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 shadow-md"
          >
            {loading ? 'Attendi...' : (isRegistering ? 'Invia Richiesta' : 'Accedi')}
          </button>
          
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
              }}
              className="text-sm text-primary hover:underline font-semibold"
            >
              {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati ora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
