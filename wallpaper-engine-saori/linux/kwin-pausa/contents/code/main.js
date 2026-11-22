// Pausa el wallpaper SAORI (org.jackos.SaoriWallpaper) cuando algo opaco lo tapa por completo.
// Se ignoran las ventanas translucidas (Konsole, Antigravity) y las propias del escritorio.
const IGNORAR = /konsole|antigravity|jackos|plasmashell|krunner/i;
let pausado = null;

function tapa(w) {
    if (!w.normalWindow || w.minimized || w.deleted || IGNORAR.test(w.resourceClass)) return false;
    if (!w.onAllDesktops && w.desktops.indexOf(workspace.currentDesktop) < 0) return false;
    if (w.fullScreen) return true;
    const a = workspace.clientArea(KWin.MaximizeArea, w), g = w.frameGeometry;
    return g.width >= a.width * 0.97 && g.height >= a.height * 0.97;
}

function revisar() {
    const hay = workspace.windowList().some(tapa);
    if (hay === pausado) return;
    pausado = hay;
    callDBus("org.jackos.SaoriWallpaper", "/", "org.jackos.SaoriWallpaper", "setPaused", hay);
}

function vigilar(w) {
    w.frameGeometryChanged.connect(revisar);
    w.minimizedChanged.connect(revisar);
    w.fullScreenChanged.connect(revisar);
    w.desktopsChanged.connect(revisar);
}

workspace.windowList().forEach(vigilar);
workspace.windowAdded.connect(w => { vigilar(w); revisar(); });
workspace.windowRemoved.connect(revisar);
workspace.currentDesktopChanged.connect(revisar);
workspace.windowActivated.connect(revisar);
revisar();
