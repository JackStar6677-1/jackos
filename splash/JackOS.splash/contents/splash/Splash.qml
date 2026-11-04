import QtQuick 2.15

Rectangle {
    id: root
    color: "#000000"
    property int stage

    Image {
        anchors.fill: parent
        source: "images/background.png"
        fillMode: Image.PreserveAspectCrop
    }

    Text {
        id: title
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -40
        text: "JACKOS"
        color: "#7d55d9"
        font.family: "JetBrains Mono"
        font.pixelSize: 56
        font.bold: true
        font.letterSpacing: 16
        SequentialAnimation on opacity {
            loops: Animation.Infinite
            NumberAnimation { to: 1.0; duration: 10 }
            PauseAnimation { duration: 2500 }
            NumberAnimation { to: 0.35; duration: 50 }
            NumberAnimation { to: 1.0; duration: 70 }
        }
    }

    Rectangle {
        id: track
        width: root.width * 0.3
        height: 4
        color: "#17112b"
        anchors { horizontalCenter: parent.horizontalCenter; top: title.bottom; topMargin: 60 }
        Rectangle {
            height: parent.height
            width: parent.width * (root.stage / 6)
            color: "#7d55d9"
            Behavior on width { NumberAnimation { duration: 400; easing.type: Easing.OutQuad } }
        }
    }
}
