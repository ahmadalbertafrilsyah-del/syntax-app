// lib/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

// Mendefinisikan tipe data untuk Context kita
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Membuat Context
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Provider untuk membungkus aplikasi
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged akan otomatis berjalan setiap kali ada yang login/logout
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Membersihkan listener saat komponen dilepas
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook agar lebih mudah dipanggil di halaman lain
export const useAuth = () => useContext(AuthContext);