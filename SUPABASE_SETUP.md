      # 🔧 Guía de Configuración - Supabase

## Configuración Rápida de Supabase para Sincronización

### Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa los datos:
   - **Name:** mi-vida-virtual
   - **Database Password:** (genera una segura)
   - **Region:** Selecciona la más cercana
5. Espera a que el proyecto se cree (~2 minutos)

---

### Paso 2: Obtener Credenciales

1. En el dashboard de tu proyecto, ve a **Settings** (⚙️)
2. Ve a **API** en el menú lateral
3. Copia los siguientes valores:
   - **Project URL** (ej: `https://abcdefgh.supabase.co`)
   - **anon public** key (la key larga que empieza con `eyJ...`)

---

### Paso 3: Configurar en el Código

Abre `index.html` y busca la sección de configuración de Supabase (línea ~9120):

```javascript
// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'TU_SUPABASE_URL';
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY';
```

Reemplaza con tus credenciales:

```javascript
// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

### Paso 4: Crear la Tabla Principal

Ve al **SQL Editor** en Supabase y ejecuta este script PRIMERO:

```sql
-- Crear tabla principal para todos los datos del usuario
CREATE TABLE user_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Habilitar Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Políticas: Los usuarios solo pueden ver/editar sus propios datos
CREATE POLICY "Users can view own data"
    ON user_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
    ON user_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
    ON user_data FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
    ON user_data FOR DELETE
    USING (auth.uid() = user_id);

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
```

---

### Paso 5: Configurar Autenticación (OPCIONAL - Tablas antiguas)

```sql
-- ========================================
-- TABLA: NOTES (Apuntes)
-- ========================================
CREATE TABLE notes (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'General',
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder ON notes(folder);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- ========================================
-- TABLA: FOLDERS (Carpetas de Apuntes)
-- ========================================
CREATE TABLE note_folders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_note_folders_user_id ON note_folders(user_id);

-- ========================================
-- TABLA: FLASHCARDS
-- ========================================
CREATE TABLE flashcards (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  deck_id BIGINT NOT NULL,
  deck TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'General',
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('qa', 'cloze')),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  source_note_id BIGINT,
  next_review TIMESTAMPTZ,
  interval INTEGER DEFAULT 1,
  ease_factor FLOAT DEFAULT 2.5,
  reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_flashcards_folder ON flashcards(folder);
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX idx_flashcards_source_note ON flashcards(source_note_id);

-- ========================================
-- TABLA: FLASHCARD_DECKS
-- ========================================
CREATE TABLE flashcard_decks (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'General',
  source_note_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcard_decks_user_id ON flashcard_decks(user_id);
CREATE INDEX idx_flashcard_decks_folder ON flashcard_decks(folder);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;

-- Políticas para NOTES
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para NOTE_FOLDERS
CREATE POLICY "Users can view their own folders"
  ON note_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON note_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON note_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON note_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para FLASHCARDS
CREATE POLICY "Users can view their own flashcards"
  ON flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para FLASHCARD_DECKS
CREATE POLICY "Users can view their own decks"
  ON flashcard_decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
  ON flashcard_decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON flashcard_decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON flashcard_decks FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- FUNCIONES ÚTILES
-- ========================================

-- Actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en notes
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

```

---

### Paso 5: Agregar la Librería de Supabase

Agrega el siguiente script en el `<head>` de tu `index.html`, **antes** del tag `<style>`:

```html
<!-- Supabase Client Library -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

### Paso 6: Habilitar la Creación de Usuarios

1. Ve a **Authentication** en el menú lateral de Supabase
2. Ve a **Settings** → **Auth Providers**
3. Habilita **Email**
4. Deshabilita "Confirm Email" si quieres testing rápido (puedes habilitarlo después)

---

### Paso 7: Crear Usuario de Prueba

Puedes crear usuarios de dos formas:

#### Opción A: Desde el Dashboard de Supabase
1. Ve a **Authentication** → **Users**
2. Haz clic en **Add User**
3. Completa email y password
4. Haz clic en **Create User**

#### Opción B: Desde tu Aplicación
Agrega temporalmente este código en la consola del navegador:

```javascript
// En la consola del navegador
await loginSupabase('tu-email@example.com', 'tu-password-seguro');
```

---

### Paso 8: Activar Sincronización

Actualiza la función `initSupabase()` en `index.html`:

```javascript
// Inicializar Supabase
function initSupabase() {
    const SUPABASE_URL = 'https://abcdefgh.supabase.co'; // TU URL
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // TU KEY
    
    // Crear cliente
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('✅ Supabase configurado correctamente');
}
```

---

## 🧪 Testing

### Probar Sincronización

1. **En PC:**
   - Crear un apunte
   - Verificar que se guarde localmente
   - Si hay sesión activa, debería sincronizar automáticamente

2. **Verificar en Supabase:**
   - Ve al **Table Editor** en Supabase
   - Abre la tabla `notes`
   - Deberías ver tu apunte

3. **En Celular:**
   - Abre la app en tu celular
   - Inicia sesión con el mismo usuario
   - Deberías ver el mismo apunte

---

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca expongas tu service_role key** - Solo usa la anon/public key en el cliente
2. **Habilita RLS** en todas las tablas (ya está configurado en el script)
3. **Valida datos** tanto en cliente como en servidor
4. **Usa HTTPS** siempre (Supabase ya lo hace por defecto)
5. **Confirma emails** en producción (puedes deshabilitarlo para testing)

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"
- Verifica que la URL de Supabase sea correcta
- Verifica tu conexión a internet
- Revisa la consola del navegador para más detalles

### Error: "Invalid API key"
- Asegúrate de usar la `anon` key, no la `service_role` key
- Copia y pega la key completa sin espacios

### Error: "new row violates row-level security policy"
- Verifica que el usuario esté autenticado
- Revisa que las políticas RLS estén correctas
- Asegúrate de que `auth.uid()` devuelva el user_id correcto

### Los datos no se sincronizan
- Verifica que `supabaseClient` y `supabaseUser` no sean `null`
- Abre la consola y busca errores
- Verifica que las funciones de sincronización se estén llamando

---

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Client JS](https://supabase.com/docs/reference/javascript/introduction)
- [SQL Editor](https://supabase.com/docs/guides/database/overview)

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Supabase
- [ ] Credenciales copiadas (URL + anon key)
- [ ] Credenciales agregadas al código
- [ ] Script SQL ejecutado
- [ ] Tablas creadas correctamente
- [ ] RLS habilitado en todas las tablas
- [ ] Librería de Supabase agregada al HTML
- [ ] Auth habilitado
- [ ] Usuario de prueba creado
- [ ] Función `initSupabase()` actualizada
- [ ] Testing realizado en PC
- [ ] Testing realizado en celular
- [ ] Sincronización funcionando correctamente

---

¡Listo! Ahora tu aplicación está sincronizada entre todos tus dispositivos 🎉
