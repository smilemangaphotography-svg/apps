from pathlib import Path

p = Path('buildsrc/Ilias-Coach/app/src/main/java/com/iliaperformance/iliacoach2026/Screens.kt')
s = p.read_text()
start_marker = '@Composable\nprivate fun SpotifyBlock(vm: CoachViewModel, spotify: SpotifyState) {'
end_marker = '\n@Composable\nprivate fun SettingsFeatureBlock'
start = s.find(start_marker)
end = s.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('Could not locate SpotifyBlock section for V5 normalization')
canonical = '''@Composable
private fun SpotifyBlock(vm: CoachViewModel, spotify: SpotifyState) {
    PremiumCard {
        Text("SPOTIFY", color = CoachLime, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
        Text(if (spotify.connected) "Connected" else "Official Spotify PKCE connection", color = CoachText, fontSize = 21.sp, fontWeight = FontWeight.Black)
        Text("Playback uses Spotify authorization and the Spotify Web API. A Spotify Client ID is configured in Owner Layout; no client secret is stored in the APK.", color = CoachMuted, fontSize = 13.sp)
        if (!spotify.connected) {
            PrimaryButton("CONNECT SPOTIFY") { vm.connectSpotify() }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MiniAction("‹‹") { vm.spotifyPrevious() }
                MiniAction("PLAY", accent = CoachLime) { vm.spotifyPlay() }
                MiniAction("PAUSE") { vm.spotifyPause() }
                MiniAction("››") { vm.spotifyNext() }
            }
            SecondaryButton("DISCONNECT") { vm.disconnectSpotify() }
        }
    }
}
'''
p.write_text(s[:start] + canonical + s[end:])
print('Normalized SpotifyBlock for deterministic V5 replacement')
