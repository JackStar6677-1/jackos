import QtQuick
import QtQuick.Controls as QQC2
import QtQuick.Layouts
import org.kde.kirigami as Kirigami
import org.kde.kcmutils as KCM

KCM.SimpleKCM {
    property alias cfg_texts: texts.text
    property alias cfg_colorA: colorA.text
    property alias cfg_colorB: colorB.text
    property alias cfg_fontSize: fontSize.value
    property alias cfg_speed: speed.value
    property alias cfg_hexStream: hexStream.checked
    property string cfg_textsDefault
    property string cfg_colorADefault
    property string cfg_colorBDefault
    property int cfg_fontSizeDefault
    property int cfg_speedDefault
    property bool cfg_hexStreamDefault

    Kirigami.FormLayout {
        QQC2.TextArea { id: texts; Kirigami.FormData.label: "Mensajes (uno por línea):"; Layout.preferredWidth: Kirigami.Units.gridUnit * 25; Layout.preferredHeight: Kirigami.Units.gridUnit * 10 }
        QQC2.TextField { id: colorA; Kirigami.FormData.label: "Color A (#rrggbb):" }
        QQC2.TextField { id: colorB; Kirigami.FormData.label: "Color B (#rrggbb):" }
        QQC2.SpinBox { id: fontSize; Kirigami.FormData.label: "Tamaño de letra (0 = tema):"; from: 0; to: 40 }
        QQC2.SpinBox { id: speed; Kirigami.FormData.label: "Velocidad (px/s):"; from: 5; to: 300 }
        QQC2.CheckBox { id: hexStream; text: "Mezclar flujo hexadecimal entre mensajes" }
    }
}
