// SPDX-License-Identifier: GPL-3.0-or-later
// JackOS Ticker: cinta que se desplaza por el hueco de la barra, con mensajes editables y hex vivo.
import QtQuick
import QtQuick.Layouts
import org.kde.kirigami as Kirigami
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid

PlasmoidItem {
    id: root
    preferredRepresentation: fullRepresentation
    Plasmoid.backgroundHints: PlasmaCore.Types.NoBackground
    Layout.fillWidth: true
    Layout.minimumWidth: 80
    Layout.preferredWidth: 600

    readonly property int fs: Plasmoid.configuration.fontSize > 0 ? Plasmoid.configuration.fontSize : Kirigami.Theme.defaultFont.pixelSize
    readonly property color ca: Plasmoid.configuration.colorA
    readonly property color cb: Plasmoid.configuration.colorB
    property string hex: ""
    function newHex() {
        var s = "0x"
        for (var i = 0; i < 28; i++) s += "0123456789ABCDEF"[Math.floor(Math.random() * 16)] + (i % 4 === 3 ? " " : "")
        hex = s
    }
    Component.onCompleted: newHex()

    // Cinta: mensajes con separadores; el hex se intercala entre ellos.
    readonly property var parts: {
        var m = Plasmoid.configuration.texts.split("\n").filter(function (t) { return t.trim() !== "" })
        var out = []
        for (var i = 0; i < m.length; i++) {
            out.push({t: m[i].toUpperCase(), c: i % 2 ? cb : ca})
            if (Plasmoid.configuration.hexStream) out.push({t: hex, c: "#ff5a6e"})
        }
        return out
    }

    fullRepresentation: Item {
        id: view
        clip: true
        implicitHeight: root.fs * 2

        Timer { interval: 4000; running: true; repeat: true; onTriggered: root.newHex() }

        // Parpadeo de glitch ocasional, como una pantalla con interferencia.
        Timer {
            interval: 6500; running: view.visible; repeat: true
            onTriggered: { glitch.restart() }
        }
        SequentialAnimation {
            id: glitch
            NumberAnimation { target: tape; property: "opacity"; to: 0.15; duration: 40 }
            NumberAnimation { target: tape; property: "opacity"; to: 1; duration: 60 }
            NumberAnimation { target: tape; property: "opacity"; to: 0.4; duration: 40 }
            NumberAnimation { target: tape; property: "opacity"; to: 1; duration: 90 }
        }

        Row {
            id: tape
            height: parent.height
            spacing: 0
            property real offset: 0
            x: -offset
            Repeater {
                model: 2   // dos copias para el bucle continuo
                delegate: Row {
                    spacing: 0
                    Repeater {
                        model: root.parts
                        delegate: Row {
                            spacing: 0
                            anchors.verticalCenter: parent.verticalCenter
                            Text {
                                text: modelData.t
                                color: modelData.c
                                font.family: "Hack"
                                font.pixelSize: root.fs
                                font.letterSpacing: 1
                                height: tape.height
                                verticalAlignment: Text.AlignVCenter
                            }
                            Text {
                                text: "   ◢◤   "
                                color: Qt.rgba(1, 1, 1, 0.22)
                                font.family: "Hack"
                                font.pixelSize: root.fs
                                height: tape.height
                                verticalAlignment: Text.AlignVCenter
                            }
                        }
                    }
                }
            }
            NumberAnimation on offset {
                from: 0; to: tape.width / 2
                duration: Math.max(1000, (tape.width / 2) / Plasmoid.configuration.speed * 1000)
                loops: Animation.Infinite
                running: view.visible && tape.width > 0
            }
        }
        // Desvanecido en los bordes.
        Rectangle { anchors.left: parent.left; width: 40; height: parent.height
            gradient: Gradient { orientation: Gradient.Horizontal
                GradientStop { position: 0; color: Kirigami.Theme.backgroundColor }
                GradientStop { position: 1; color: "transparent" } } }
        Rectangle { anchors.right: parent.right; width: 40; height: parent.height
            gradient: Gradient { orientation: Gradient.Horizontal
                GradientStop { position: 0; color: "transparent" }
                GradientStop { position: 1; color: Kirigami.Theme.backgroundColor } } }
    }
}
