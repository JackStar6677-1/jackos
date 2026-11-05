// SPDX-License-Identifier: GPL-3.0-or-later
// JackOS Monitor: sensores de KDE en texto compacto, todo editable desde la configuración.
import QtQuick
import QtQuick.Layouts
import org.kde.kirigami as Kirigami
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid
import QtQuick.Shapes
import org.kde.ksysguard.sensors as Sensors

PlasmoidItem {
    id: root
    preferredRepresentation: fullRepresentation
    Plasmoid.backgroundHints: PlasmaCore.Types.NoBackground
    Layout.fillHeight: true

    readonly property var items: {
        try { return JSON.parse(Plasmoid.configuration.items) } catch (e) { return [] }
    }
    readonly property string fam: "Hack"
    readonly property int fs: Plasmoid.configuration.fontSize > 0 ? Plasmoid.configuration.fontSize : Kirigami.Theme.defaultFont.pixelSize

    fullRepresentation: RowLayout {
        spacing: Plasmoid.configuration.spacing
        Layout.minimumWidth: implicitWidth
        Layout.preferredWidth: implicitWidth

        Repeater {
            model: root.items
            delegate: Item {
                id: cell
                readonly property color accent: modelData.color || Kirigami.Theme.highlightColor
                readonly property real pad: 9
                readonly property real ch: 5
                Layout.alignment: Qt.AlignVCenter
                Layout.preferredHeight: root.fs * 2
                implicitWidth: row.implicitWidth + pad * 2
                implicitHeight: root.fs * 2
                Layout.preferredWidth: implicitWidth
                Sensors.Sensor {
                    id: sensor
                    sensorId: modelData.sensor
                    updateRateLimit: Plasmoid.configuration.updateMs
                }
                // Celda con esquinas cortadas (arriba-izq y abajo-der) y borde neón.
                Shape {
                    anchors.fill: parent
                    ShapePath {
                        strokeWidth: 1
                        strokeColor: Qt.rgba(cell.accent.r, cell.accent.g, cell.accent.b, 0.65)
                        fillColor: Qt.rgba(cell.accent.r, cell.accent.g, cell.accent.b, 0.10)
                        startX: cell.ch; startY: 0.5
                        PathLine { x: cell.width - 0.5; y: 0.5 }
                        PathLine { x: cell.width - 0.5; y: cell.height - cell.ch }
                        PathLine { x: cell.width - cell.ch; y: cell.height - 0.5 }
                        PathLine { x: 0.5; y: cell.height - 0.5 }
                        PathLine { x: 0.5; y: cell.ch }
                        PathLine { x: cell.ch; y: 0.5 }
                    }
                }
                // Filo neón inferior con brillo.
                Rectangle {
                    visible: Plasmoid.configuration.showBar
                    x: cell.ch; y: parent.height - 2; height: 2
                    width: parent.width - cell.ch * 2
                    color: cell.accent
                }
                Rectangle {
                    visible: Plasmoid.configuration.showBar
                    x: cell.ch; y: parent.height - 5; height: 5
                    width: parent.width - cell.ch * 2
                    gradient: Gradient {
                        GradientStop { position: 0; color: "transparent" }
                        GradientStop { position: 1; color: Qt.rgba(cell.accent.r, cell.accent.g, cell.accent.b, 0.35) }
                    }
                }
                RowLayout {
                    id: row
                    anchors.centerIn: parent
                    spacing: 6
                    Text {
                        visible: (modelData.label || "") !== ""
                        text: (modelData.label || "").toUpperCase()
                        color: cell.accent
                        font.family: root.fam
                        font.pixelSize: root.fs
                        font.bold: true
                        font.letterSpacing: 1
                    }
                    Text {
                        text: sensor.formattedValue
                        color: Plasmoid.configuration.colorValue ? cell.accent : "#e8e8f0"
                        font.family: root.fam
                        font.pixelSize: root.fs
                        font.bold: Plasmoid.configuration.bold
                        Layout.minimumWidth: valueMetrics.width
                        TextMetrics { id: valueMetrics; font.family: root.fam; font.pixelSize: root.fs; font.bold: Plasmoid.configuration.bold; text: sensor.formattedValue.indexOf("/s") >= 0 ? "8888,8 MiB/s" : "888,8 °C" }
                    }
                }
            }
        }
    }
}
