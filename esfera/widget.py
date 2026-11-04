#!/usr/bin/env python3
"""Widget de escritorio: la esfera Jarvis en una ventana transparente, sin marco, sin foco y que deja pasar el raton.
La posicion/capa (debajo de todo, en todos los escritorios) la fija una regla de KWin (Wayland no deja posicionar)."""
import functools, http.server, os, socket, sys, threading
os.environ.setdefault("QTWEBENGINE_CHROMIUM_FLAGS", "--ignore-gpu-blocklist --enable-gpu-rasterization --use-angle=gl --disable-gpu-vsync")
from PyQt6.QtCore import Qt, QUrl
from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineWidgets import QWebEngineView

DIR = os.environ.get("ESFERA_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__))))
PORT, SIZE = 8765, int(os.environ.get("ESFERA_SIZE", "760"))
if socket.socket().connect_ex(("127.0.0.1", PORT)) != 0:
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIR)
    h.log_message = lambda *a: None
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

app = QApplication(sys.argv); app.setApplicationName("jackos-esfera"); app.setDesktopFileName("jackos-esfera")
v = QWebEngineView()
v.setWindowTitle("JackOS Esfera")
v.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Tool | Qt.WindowType.WindowTransparentForInput | Qt.WindowType.WindowDoesNotAcceptFocus)
v.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
v.setStyleSheet("background: transparent")
v.page().setBackgroundColor(Qt.GlobalColor.transparent)
v.resize(SIZE, SIZE)
v.load(QUrl(f"http://127.0.0.1:{PORT}/esfera.html?widget=1"))
v.show()
sys.exit(app.exec())
