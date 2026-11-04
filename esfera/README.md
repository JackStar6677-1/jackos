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
