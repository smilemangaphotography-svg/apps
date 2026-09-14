from pathlib import Path

path = Path("app/src/main/java/eu/infinitedrive/app/MainActivity.kt")
source = path.read_text(encoding="utf-8")

old = '''    private fun showSourceChooser() {
        val items = arrayOf(
            "Local Music — full in-app playback",
            "Spotify — authorized external playback",
            "YouTube Music — authorized external playback"
        )
        AlertDialog.Builder(this)
            .setTitle("CONNECT MUSIC")
            .setMessage("Choose one source. INFINITE DRIVE will expose only the approved Fight Mode tracks.")
            .setItems(items) { _, which ->
                when (which) {
                    0 -> {
                        setSource(SourceMode.LOCAL)
                        requestLocalAccessAndScan()
                    }
                    1 -> setSource(SourceMode.SPOTIFY)
                    2 -> setSource(SourceMode.YOUTUBE_MUSIC)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
'''

new = '''    private fun showSourceChooser() {
        lateinit var dialog: AlertDialog

        val chooser = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(8), dp(18), dp(8))

            addView(
                text(
                    "Choose one source. INFINITE DRIVE will expose only the approved Fight Mode tracks.",
                    14,
                    Color.rgb(225, 225, 225)
                )
            )

            addView(
                primaryButton("LOCAL MUSIC  •  FULL IN-APP PLAYBACK") {
                    dialog.dismiss()
                    setSource(SourceMode.LOCAL)
                    requestLocalAccessAndScan()
                },
                mt(16)
            )

            addView(
                button("SPOTIFY  •  OPEN APPROVED TRACKS") {
                    dialog.dismiss()
                    setSource(SourceMode.SPOTIFY)
                },
                mt(9)
            )

            addView(
                button("YOUTUBE MUSIC  •  OPEN APPROVED TRACKS") {
                    dialog.dismiss()
                    setSource(SourceMode.YOUTUBE_MUSIC)
                },
                mt(9)
            )

            addView(
                text(
                    "Spotify and YouTube Music stay in their official apps. Local Music provides the complete in-app player.",
                    12,
                    Color.rgb(170, 170, 170)
                ),
                mt(12)
            )
        }

        dialog = AlertDialog.Builder(this)
            .setTitle("CONNECT MUSIC")
            .setView(chooser)
            .setNegativeButton("CANCEL", null)
            .create()

        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(accent())
        }
        dialog.show()
    }
'''

if new in source:
    print("Source chooser already patched")
elif old in source:
    path.write_text(source.replace(old, new), encoding="utf-8")
    print("Source chooser patched")
else:
    raise SystemExit("Expected source chooser block was not found; refusing an unsafe patch")
