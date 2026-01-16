-- Dodaj novu kolonu statuskupca u tabelu traznja
-- Moguće vrednosti: NULL (prazno), 'hladan', 'mlak', 'vruc'

ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS statuskupca text NULL;

-- Dodaj komentar za dokumentaciju
COMMENT ON COLUMN public.traznja.statuskupca IS 'Status kupca: hladan, mlak, vruc ili prazno (NULL)';
