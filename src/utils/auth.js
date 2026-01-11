import { supabase } from './supabase'

export const login = async (email, password) => {
  try {
    // Trim email i password da uklonimo eventualne razmake
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    console.log('=== LOGIN DEBUG START ===')
    console.log('Login attempt:', { 
      email: trimmedEmail, 
      passwordLength: trimmedPassword.length,
      password: trimmedPassword // Prikaži password za debug (obriši u production)
    })

    // Test query - proveri da li uopšte možemo da čitamo iz tabele
    console.log('Testing basic SELECT access...')
    const { data: testData, error: testError } = await supabase
      .from('korisnici')
      .select('id, email')
      .limit(5)

    console.log('Test query result:', { 
      data: testData, 
      error: testError,
      canRead: !testError && testData !== null
    })

    if (testError) {
      console.error('❌ Cannot read from korisnici table! RLS might be blocking:', testError)
      if (testError.code === '42501') {
        throw new Error('RLS blokira pristup tabeli korisnici. Proveri RLS politike u Supabase Dashboard → Authentication → Policies')
      }
    }

    // Prvo proveravamo da li korisnik postoji u tabeli korisnici
    console.log('Querying for user with email and password...')
    const { data: korisnici, error: korisnikError } = await supabase
      .from('korisnici')
      .select('*')
      .eq('email', trimmedEmail)
      .eq('password', trimmedPassword)

    console.log('Supabase query result:', { 
      data: korisnici, 
      error: korisnikError,
      count: korisnici?.length,
      errorCode: korisnikError?.code,
      errorMessage: korisnikError?.message
    })

    if (korisnikError) {
      console.error('Supabase error details:', {
        code: korisnikError.code,
        message: korisnikError.message,
        details: korisnikError.details,
        hint: korisnikError.hint
      })
      
      if (korisnikError.code === '42501') {
        throw new Error('RLS blokira pristup tabeli korisnici. Proveri RLS politike u Supabase Dashboard → Authentication → Policies')
      }
      throw new Error('Greška pri povezivanju sa bazom: ' + korisnikError.message)
    }

    if (!korisnici || korisnici.length === 0) {
      console.log('No user found with matching email and password. Checking if email exists...')
      
      // Proveri da li postoji korisnik sa tim email-om
      const { data: emailCheck, error: emailError } = await supabase
        .from('korisnici')
        .select('id, email, password')
        .eq('email', trimmedEmail)
        .limit(1)
      
      console.log('Email check result:', { 
        data: emailCheck, 
        error: emailError,
        found: emailCheck && emailCheck.length > 0
      })
      
      if (emailError) {
        console.error('Email check error:', emailError)
        if (emailError.code === '42501') {
          throw new Error('RLS blokira pristup tabeli korisnici. Proveri RLS politike u Supabase Dashboard → Authentication → Policies')
        }
      }
      
      if (emailCheck && emailCheck.length > 0) {
        // Debug: prikaži šta je u bazi
        const dbPassword = emailCheck[0].password
        const passwordsMatch = dbPassword === trimmedPassword
        
        console.log('🔍 User found in DB - Password comparison:', {
          id: emailCheck[0].id,
          email: emailCheck[0].email,
          passwordInDb: dbPassword,
          passwordInDbLength: dbPassword?.length,
          inputPassword: trimmedPassword,
          inputPasswordLength: trimmedPassword.length,
          passwordsMatch: passwordsMatch,
          passwordChars: {
            db: dbPassword?.split('').map((c, i) => `${i}:${c}(${c.charCodeAt(0)})`).join(', '),
            input: trimmedPassword?.split('').map((c, i) => `${i}:${c}(${c.charCodeAt(0)})`).join(', ')
          }
        })
        
        if (!passwordsMatch) {
          throw new Error(`Pogrešan password. DB password length: ${dbPassword?.length}, Input length: ${trimmedPassword.length}`)
        } else {
          throw new Error('Password se poklapa ali query nije vratio rezultat. Proveri RLS politike.')
        }
      } else {
        // Proveri sve korisnike u bazi za debug
        console.log('Checking all users in DB...')
        const { data: allUsers, error: allUsersError } = await supabase
          .from('korisnici')
          .select('id, email')
          .limit(10)
        
        console.log('All users in DB:', { 
          users: allUsers, 
          count: allUsers?.length,
          error: allUsersError 
        })
        
        if (allUsersError && allUsersError.code === '42501') {
          throw new Error('RLS blokira pristup tabeli korisnici. Proveri RLS politike u Supabase Dashboard → Authentication → Policies')
        }
        
        throw new Error(`Korisnik sa email-om "${trimmedEmail}" ne postoji u bazi. Ukupno korisnika u bazi: ${allUsers?.length || 0}`)
      }
    }

    const korisnik = korisnici[0]
    console.log('✅ Login successful:', { 
      id: korisnik.id, 
      email: korisnik.email, 
      naziv: korisnik.naziv 
    })
    console.log('=== LOGIN DEBUG END ===')

    // Čuvamo korisnika u localStorage
    localStorage.setItem('user', JSON.stringify(korisnik))
    
    // Postavi timestamp za login - koristi se za generisanje nove motivacione poruke
    localStorage.setItem('login_timestamp', Date.now().toString())
    
    // Obriši sessionStorage za motivacionu poruku da se generiše nova
    sessionStorage.removeItem('dashboard_motivacija')
    sessionStorage.removeItem('dashboard_motivacija_timestamp')
    
    return { data: korisnik, error: null }
  } catch (error) {
    console.error('❌ Login error:', error)
    console.log('=== LOGIN DEBUG END ===')
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

