# Fondo de video en KDE Plasma 6 (Wayland)

Plugin: **Smart Video Wallpaper Reborn** (`luisbocanegra.smart.video.wallpaper.reborn`), desde
Configuración > Fondo de pantalla > Obtener nuevos.

Trampas (probadas en Intel Iris Xe):
1. `QT_MEDIA_BACKEND=gstreamer` deja el escritorio en NEGRO sin dar error. Usa `ffmpeg`.
2. ffmpeg decodifica por software y un video 2560x1600 se come un núcleo (~101% CPU).
   `QT_FFMPEG_DECODING_HW_DEVICE_TYPES=vaapi` lo baja a ~6%.
   Ambas variables: copia `90-qt-media-vaapi.conf` a `~/.config/environment.d/` y reinicia sesión.
3. Escribe la config del wallpaper con plasmashell cerrado o se pisa al salir.

## Fondo ASCII (idea para Nix)
Convierte un video corto en loop a ASCII/estilo terminal (p. ej. con ffmpeg + un filtro de
caracteres, o el `generar.py` de Blackwall), expórtalo en H.264 a 15–24 fps y úsalo como fondo.
El video de Jack NO va en el repo (≈350 MB y deriva de material con copyright): hazte el tuyo.
