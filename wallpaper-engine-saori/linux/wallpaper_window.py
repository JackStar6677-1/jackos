#!/usr/bin/env python3
"""Wallpaper SAORI vivo en Linux: ventana WebEngine sin marco, sin foco y transparente al raton.
La capa (debajo de todo) y la posicion las fija una regla de KWin (Wayland no deja posicionarse sola).
El audio llega por WebSocket desde saori_wallpaper_daemon.py y se entrega como lo hace Wallpaper Engine."""
import os, sys
DPR = os.environ.get("SAORI_WP_DPR", "1")   # 1 = renderiza a pixeles logicos (mucho menos GPU que 1.35)
os.environ.setdefault("QTWEBENGINE_CHROMIUM_FLAGS",
    f"--ignore-gpu-blocklist --enable-gpu-rasterization --use-angle=gl --disable-gpu-vsync --force-device-scale-factor={DPR}")
from PyQt6.QtCore import Qt, QUrl, QObject, pyqtSlot, pyqtClassInfo
from PyQt6.QtDBus import QDBusConnection
from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineCore import QWebEngineScript, QWebEnginePage
from PyQt6.QtWebEngineWidgets import QWebEngineView

W, H = int(os.environ.get("SAORI_WP_W", "1897")), int(os.environ.get("SAORI_WP_H", "1186"))
SHIM = """
(() => {
  let cb = null;
  window.wallpaperRegisterAudioListener = f => { cb = f; };
  const conectar = () => {
    const ws = new WebSocket('ws://127.0.0.1:18766');
    ws.onmessage = e => { if (cb) { try { cb(JSON.parse(e.data)); } catch (_) {} } };
    ws.onclose = () => setTimeout(conectar, 1500);
  };
  conectar();
})();
"""
app = QApplication(sys.argv); app.setApplicationName("jackos-saori-wallpaper"); app.setDesktopFileName("jackos-saori-wallpaper")
v = QWebEngineView()
v.setWindowTitle("JackOS SAORI Wallpaper")
v.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Tool | Qt.WindowType.WindowTransparentForInput | Qt.WindowType.WindowDoesNotAcceptFocus)
s = QWebEngineScript(); s.setName("audio-shim"); s.setSourceCode(SHIM)
s.setInjectionPoint(QWebEngineScript.InjectionPoint.DocumentCreation); s.setWorldId(QWebEngineScript.ScriptWorldId.MainWorld)
v.page().scripts().insert(s)
v.resize(W, H)
v.load(QUrl("http://127.0.0.1:18765/index.html"))

@pyqtClassInfo("D-Bus Interface", "org.jackos.SaoriWallpaper")
class Control(QObject):
    """KWin (pausa.js) avisa por D-Bus cuando una ventana grande tapa el escritorio: se congela la pagina."""
    @pyqtSlot(bool)
    def setPaused(self, pausa):
        pg, L = v.page(), QWebEnginePage.LifecycleState
        if pausa:
            pg.setVisible(False); pg.setLifecycleState(L.Frozen)
        else:
            pg.setLifecycleState(L.Active); pg.setVisible(True)

control = Control()
bus = QDBusConnection.sessionBus()
bus.registerService("org.jackos.SaoriWallpaper")
bus.registerObject("/", control, QDBusConnection.RegisterOption.ExportAllSlots)
v.show()
sys.exit(app.exec())
