import { useContext, createContext } from 'react';
import { useStorageState } from './useStorageState';
import axios from 'axios';

const AuthContext = createContext({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }
  return value;
}

export function SessionProvider({ children }) {
  const [[isLoading, session], setSession] = useStorageState('session_token');

  return (
    <AuthContext.Provider
      value={{
        signIn: async (email, password) => {
          try {
            const response = await axios.post('https://regular-giraffe-worthy.ngrok-free.app/auth', {
              email,
              password
            });
            
            if (response.data?.data?.token) {
              await setSession(response.data.data.token);
              return { success: true };
            }
            return { success: false, error: 'Credenciales incorrectas' };
          } catch (error) {
            return { 
              success: false, 
              error: error.response?.data?.message || 'Error al iniciar sesión'
            };
          }
        },
        signOut: () => {
          setSession(null);
        },
        session,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}