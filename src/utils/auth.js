import { supabase } from './supabase'

export const login = async (email, password) => {
  try {
    // Trim email i password da uklonimo eventualne razmake
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    console.log('Login attempt:', { email: trimmedEmail, passwordLength: trimmedPassword.length })

    // Prvo proveravamo da li korisnik postoji u tabeli korisnici
    const { data: korisnici, error: korisnikError } = await supabase
      .from('korisnici')
      .select('*')
      .eq('email', trimmedEmail)
      .eq('password', trimmedPassword)

    console.log('Supabase query result:', { 
      data: korisnici, 
      error: korisnikError,
      count: korisnici?.length 
    })

    if (korisnikError) {
      console.error('Supabase error:', korisnikError)
      throw new Error('Greška pri povezivanju sa bazom: ' + korisnikError.message)
    }

    if (!korisnici || korisnici.length === 0) {
      // Proveri da li postoji korisnik sa tim email-om
      const { data: emailCheck, error: emailError } = await supabase
        .from('korisnici')
        .select('id, email, password')
        .eq('email', trimmedEmail)
        .limit(1)
      
      console.log('Email check result:', { data: emailCheck, error: emailError })
      
      if (emailError) {
        console.error('Email check error:', emailError)
      }
      
      if (emailCheck && emailCheck.length > 0) {
        // Debug: prikaži šta je u bazi
        console.log('User found in DB:', {
          id: emailCheck[0].id,
          email: emailCheck[0].email,
          passwordInDb: emailCheck[0].password,
          passwordLength: emailCheck[0].password?.length,
          inputPasswordLength: trimmedPassword.length,
          passwordsMatch: emailCheck[0].password === trimmedPassword
        })
        throw new Error('Pogrešan password')
      } else {
        // Proveri sve korisnike u bazi za debug
        const { data: allUsers } = await supabase
          .from('korisnici')
          .select('id, email')
          .limit(10)
        console.log('All users in DB:', allUsers)
        throw new Error('Korisnik sa ovim email-om ne postoji')
      }
    }

    const korisnik = korisnici[0]
    console.log('Login successful:', { id: korisnik.id, email: korisnik.email, naziv: korisnik.naziv })

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

