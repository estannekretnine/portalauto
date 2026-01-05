import { supabase } from './supabase'

export const login = async (email, password) => {
  try {
    // Prvo proveravamo da li korisnik postoji u tabeli korisnici
    const { data: korisnik, error: korisnikError } = await supabase
      .from('korisnici')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (korisnikError || !korisnik) {
      throw new Error('Pogrešan email ili password')
    }

    // Čuvamo korisnika u localStorage
    localStorage.setItem('user', JSON.stringify(korisnik))
    
    return { data: korisnik, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

export const logout = () => {
  localStorage.removeItem('user')
}

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const isAuthenticated = () => {
  return getCurrentUser() !== null
}

