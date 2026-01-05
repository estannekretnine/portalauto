import { supabase } from './supabase'

export const login = async (email, password) => {
  try {
    // Trim email i password da uklonimo eventualne razmake
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    // Prvo proveravamo da li korisnik postoji u tabeli korisnici
    const { data: korisnici, error: korisnikError } = await supabase
      .from('korisnici')
      .select('*')
      .eq('email', trimmedEmail)
      .eq('password', trimmedPassword)

    if (korisnikError) {
      console.error('Supabase error:', korisnikError)
      throw new Error('Greška pri povezivanju sa bazom: ' + korisnikError.message)
    }

    if (!korisnici || korisnici.length === 0) {
      // Proveri da li postoji korisnik sa tim email-om
      const { data: emailCheck } = await supabase
        .from('korisnici')
        .select('email')
        .eq('email', trimmedEmail)
        .limit(1)
      
      if (emailCheck && emailCheck.length > 0) {
        throw new Error('Pogrešan password')
      } else {
        throw new Error('Korisnik sa ovim email-om ne postoji')
      }
    }

    const korisnik = korisnici[0]

    // Čuvamo korisnika u localStorage
    localStorage.setItem('user', JSON.stringify(korisnik))
    
    return { data: korisnik, error: null }
  } catch (error) {
    console.error('Login error:', error)
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

