# Esfera Jarvis

Una bola 3D de grafos vivos estilo Jarvis: miles de nodos y cientos de miles de aristas en la GPU (shaders propios + bloom), anillos HUD que giran, una flota de contenedores en órbita y una constelación de agentes con pulsos de energía por dentro. **Todo el movimiento es periódico**, así que se puede renderizar a video en bucle perfecto y usar de fondo de pantalla.

Viene con datos de **demostración** (generados al azar, nada real). Para usar tus propios datos, genera los mismos ficheros (`pos.bin`, `nodes.bin`, `edges.bin`, `kinds.bin`, `meta.json`; mira `demo/generar_demo.py` para el formato) y pasa `?data=ruta`.

```bash
cd esfera
npm install
python3 demo/generar_demo.py        # datos de demostración
python3 -m http.server 8765         # y abre http://127.0.0.1:8765/esfera.html
```

## Fondo de pantalla en video

```bash
node render.js 2560 1600 15 61.95 esfera.mp4     # ancho alto fps segundos(bucle) salida
```

Necesita Chrome/Chromium y ffmpeg. Ejemplo de mezcla encima de otro video (modo *screen* para respetar el brillo aditivo):

```bash
ffmpeg -i fondo.mp4 -stream_loop 3 -i esfera.mp4 -filter_complex \
 "[0:v]lutrgb=r=val*.38:g=val*.38:b=val*.44[a];[a][1:v]blend=all_mode=screen:shortest=1" salida.mp4
```

Sin etiquetas de texto a propósito: se puede mostrar en stream sin filtrar nombres de proyectos.

## Widget flotante en el escritorio (KDE Plasma 6 · Wayland)

Más liviano que meterla en un video: la esfera se dibuja en vivo en una ventana **transparente** que se queda debajo de todo, encima de tu fondo (que puede ser un video, un ASCII, lo que sea).

```bash
sudo apt install python3-pyqt6.qtwebengine
python3 widget.py            # abre el widget (sirve la carpeta en 127.0.0.1:8765)
ESFERA_DIR=/ruta/a/tus/datos ESFERA_SIZE=760 python3 widget.py
```

Wayland no deja que una app se posicione sola: lo hace una regla de KWin. Añade esto a `~/.config/kwinrulesrc` (ajusta `position`/`size` a tu pantalla) y ejecuta `qdbus6 org.kde.KWin /KWin reconfigure`:

```ini
[General]
count=1
rules=jackos-esfera

[jackos-esfera]
Description=JackOS Esfera
wmclass=jackos-esfera
wmclassmatch=1
below=true
belowrule=2
skiptaskbar=true
skiptaskbarrule=2
skippager=true
skippagerrule=2
skipswitcher=true
skipswitcherrule=2
noborder=true
noborderrule=2
position=1077,213
positionrule=2
size=760,760
sizerule=2
```

Notas: deja pasar el ratón (no estorba a tus iconos), se oculta con «Mostrar escritorio» y pinta a ~24 fps.
