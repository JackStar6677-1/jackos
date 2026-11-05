import QtQuick
import QtQuick.Controls as QQC2
import QtQuick.Layouts
import org.kde.kirigami as Kirigami
import org.kde.kcmutils as KCM

KCM.SimpleKCM {
    id: page
    property string cfg_items
    property string cfg_itemsDefault
    property alias cfg_fontSize: fontSize.value
    property alias cfg_bold: bold.checked
    property alias cfg_showBar: showBar.checked
    property alias cfg_colorValue: colorValue.checked
    property alias cfg_spacing: spacing.value
    property alias cfg_updateMs: updateMs.value
    property int cfg_fontSizeDefault
    property bool cfg_boldDefault
    property bool cfg_showBarDefault
    property bool cfg_colorValueDefault
    property int cfg_spacingDefault
    property int cfg_updateMsDefault

    property var rows: { try { return JSON.parse(cfg_items) } catch (e) { return [] } }
    function commit(r) { rows = r; cfg_items = JSON.stringify(r) }
    function setField(i, k, v) { var r = rows.slice(); r[i] = Object.assign({}, r[i]); r[i][k] = v; commit(r) }
    function move(i, d) { var r = rows.slice(); var j = i + d; if (j < 0 || j >= r.length) return; var t = r[i]; r[i] = r[j]; r[j] = t; commit(r) }
    function remove(i) { var r = rows.slice(); r.splice(i, 1); commit(r) }
    function add() { var r = rows.slice(); r.push({label: "CPU", sensor: "cpu/all/usage", color: "#00f0ff"}); commit(r) }

    readonly property var sugeridos: [
        "cpu/all/usage", "cpu/all/averageTemperature", "cpu/all/maximumTemperature", "memory/physical/usedPercent",
        "memory/physical/used", "network/all/download", "network/all/upload", "gpu/gpu1/usage", "gpu/gpu1/temperature",
        "gpu/gpu1/usedVram", "gpu/gpu1/power", "disk/all/usedPercent", "disk/all/free", "disk/all/read", "disk/all/write"
    ]

    Kirigami.FormLayout {
        QQC2.SpinBox { id: fontSize; Kirigami.FormData.label: "Tamaño de letra (0 = tema):"; from: 0; to: 40 }
        QQC2.CheckBox { id: bold; text: "Negrita" }
        QQC2.CheckBox { id: showBar; text: "Barrita de color antes de cada dato" }
        QQC2.CheckBox { id: colorValue; text: "Colorear también el valor" }
        QQC2.SpinBox { id: spacing; Kirigami.FormData.label: "Separación (px):"; from: 0; to: 60 }
        QQC2.SpinBox { id: updateMs; Kirigami.FormData.label: "Actualizar cada (ms):"; from: 250; to: 10000; stepSize: 250 }

        Kirigami.Separator { Kirigami.FormData.isSection: true; Kirigami.FormData.label: "Datos (arriba = a la izquierda)" }

        Repeater {
            model: page.rows
            delegate: RowLayout {
                Kirigami.FormData.label: (index + 1) + "."
                QQC2.TextField {
                    text: modelData.label; placeholderText: "etiqueta"; Layout.preferredWidth: Kirigami.Units.gridUnit * 5
                    onEditingFinished: page.setField(index, "label", text)
                }
                QQC2.ComboBox {
                    editable: true; Layout.preferredWidth: Kirigami.Units.gridUnit * 15
                    model: page.sugeridos
                    Component.onCompleted: editText = modelData.sensor
                    onAccepted: page.setField(index, "sensor", editText)
                    onActivated: page.setField(index, "sensor", currentText)
                }
                QQC2.TextField {
                    text: modelData.color; placeholderText: "#rrggbb"; Layout.preferredWidth: Kirigami.Units.gridUnit * 5
                    color: acceptableInput ? Kirigami.Theme.textColor : Kirigami.Theme.negativeTextColor
                    validator: RegularExpressionValidator { regularExpression: /^#[0-9a-fA-F]{6}$/ }
                    onEditingFinished: if (acceptableInput) page.setField(index, "color", text)
                }
                Rectangle { width: Kirigami.Units.gridUnit; height: width; radius: 3; color: modelData.color }
                QQC2.ToolButton { icon.name: "go-up"; enabled: index > 0; onClicked: page.move(index, -1) }
                QQC2.ToolButton { icon.name: "go-down"; enabled: index < page.rows.length - 1; onClicked: page.move(index, 1) }
                QQC2.ToolButton { icon.name: "edit-delete"; onClicked: page.remove(index) }
            }
        }
        QQC2.Button { text: "Añadir dato"; icon.name: "list-add"; onClicked: page.add() }
    }
}
