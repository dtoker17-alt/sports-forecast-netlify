# Sports Forecast Pro — Netlify Edition 🏀🎾

Dashboard profesional de pronósticos deportivos en **modo oscuro** conectado en tiempo real a la API de Bzzoiro Sports.
Diseñado para zona horaria **México Centro (CST/CDT)**.

---

## Características

| Sección | Descripción |
|---------|-------------|
| 🔴 **En Vivo** | Partidos en curso con scores en tiempo real, actualización cada 45 s |
| 📅 **Por Jugar Hoy** | Partidos programados del día en hora México |
| ★ **Apuestas Fuertes** | Picks con EV > 4% y confianza alta — análisis automático |
| 📋 **Historial** | Registro de picks con resultado (ganada/perdida/pendiente) |
| 🔍 **Buscador** | Por equipo, jugador o liga |
| 🔄 **Actualizar Datos** | Fuerza re-fetch de toda la API y recalcula motores matemáticos |

### Modelos matemáticos integrados
- **Baloncesto:** Distribución de Skellam (diferencia de Poisson) con ELO→λ
- **Tenis:** Cadenas de Markov exactas (punto → juego → set → partido) con inversión numérica de Hold%
- **EV:** `P_modelo × (odds−1) − (1−P_modelo)` solo picks positivos
- **Kelly Fraccional 25%:** stake óptimo sobre bankroll

---

## Estructura del proyecto

```
forecast-netlify/
├── netlify.toml                      ← Configuración de build y redirects
├── netlify/
│   └── functions/
│       └── proxy.js                  ← Proxy serverless (oculta la API key)
└── public/                           ← Archivos estáticos servidos por Netlify
    ├── index.html                    ← SPA principal (3 tabs + historial)
    ├── css/
    │   └── main.css                  ← Tema oscuro completo
    └── js/
        ├── config.js                 ← Constantes y umbrales
        ├── api.js                    ← Cliente API con caché
        ├── math.js                   ← Motores Skellam + Markov + EV + Kelly
        ├── history.js                ← Gestión de historial en localStorage
        ├── dashboard.js              ← Renderizado de UI (tarjetas, modal, tabla)
        └── app.js                    ← Controlador principal
```

---

## Deploy en Netlify (5 pasos)

### 1. Sube a GitHub
```bash
git init
git add .
git commit -m "Sports Forecast Pro - initial commit"
git remote add origin https://github.com/TU_USUARIO/sports-forecast-pro.git
git push -u origin main
```

### 2. Conecta en Netlify
1. Ve a [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
2. Selecciona tu repositorio de GitHub
3. Netlify detecta `netlify.toml` automáticamente

### 3. Configura la API Key
En Netlify → **Site configuration** → **Environment variables** → **Add variable**:

```
Key:   BZZOIRO_API_KEY
Value: TU_API_KEY_DE_BZZOIRO
```

> **Nota:** Basketball y Tenis requieren el **Sports Pack ($5/mo)** de Bzzoiro.
> Regístrate en https://sports.bzzoiro.com/register/ y suscríbete en https://sports.bzzoiro.com/pricing/

### 4. Deploy
Haz clic en **Deploy site**. Netlify ejecuta el build y la función proxy queda activa.

### 5. ¡Listo!
Tu URL será algo como `https://tu-nombre.netlify.app`

---

## Desarrollo local

### Requisitos
- Node.js 18+
- Netlify CLI: `npm install -g netlify-cli`

### Setup
```bash
cd forecast-netlify

# Crea archivo de entorno local
echo "BZZOIRO_API_KEY=tu_key_aqui" > .env

# Instala la CLI si no la tienes
npm install -g netlify-cli

# Inicia el servidor local (incluye las Netlify Functions)
netlify dev
```

Abre http://localhost:8888

---

## Endpoints de Bzzoiro utilizados

### Baloncesto (`/basketball/api/v2/`)
| Endpoint | Uso |
|----------|-----|
| `GET /events/?status=live` | Partidos en vivo |
| `GET /events/?status=scheduled&date_from=...&date_to=...` | Partidos del día |
| `GET /events/{id}/` | Detalle + predicción ELO |
| `GET /events/{id}/box-score/` | Estadísticas por jugador |
| `GET /events/{id}/team-stats/` | Estadísticas de equipo |
| `GET /predictions/` | Predicciones ELO ordenadas por confianza |

### Tenis (`/tennis/api/v2/`)
| Endpoint | Uso |
|----------|-----|
| `GET /matches/live/` | Partidos en vivo con marcador en tiempo real |
| `GET /matches/?status=scheduled` | Partidos del día |
| `GET /matches/{id}/` | Detalle con estadísticas de saque |
| `GET /predictions/` | Predicciones XGBoost con confianza |
| `GET /rankings/?type=ATP` | Ranking ATP/WTA |

Autenticación: `Authorization: Token YOUR_KEY` (manejado server-side en el proxy).

---

## Configuración de umbrales (js/config.js)

```js
STRONG_BET_EV:         0.04,   // EV mínimo para "Apuesta Fuerte"
STRONG_BET_CONFIDENCE: 0.62,   // Confianza mínima del modelo
FRACTIONAL_KELLY:      0.25,   // 25% del Kelly clásico
NBA_AVG_PTS:           112.0,  // Puntos promedio NBA para calibrar Skellam
```

---

## Notas sobre el plan gratuito de Netlify

- Las Netlify Functions se ejecutan en cada request (serverless, sin cold start problemático)
- No hay base de datos — el historial de apuestas usa `localStorage` del navegador
- El caché en memoria de la API se resetea con cada reload (normal en serverless)
- Sin límite de deploys en el plan gratuito

---

## Licencia

MIT — Uso libre, sin garantías. Los pronósticos son puramente matemáticos y no constituyen asesoramiento financiero.
