package eu.infinitedrive.app

import android.Manifest
import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import java.security.MessageDigest
import java.util.Locale

class MainActivity : ComponentActivity() {
    private enum class Page { PLAYER, PLAYLIST, RUN, SETTINGS }
    private enum class SourceMode { LOCAL, SPOTIFY, YOUTUBE_MUSIC }

    private data class LocalMatch(val uri: Uri, val durationMs: Long)
    private data class MediaCandidate(val title: String, val artist: String, val uri: Uri, val durationMs: Long)

    private lateinit var content: FrameLayout
    private val prefs by lazy { getSharedPreferences("infinite_drive", MODE_PRIVATE) }
    private val matches = mutableMapOf<String, LocalMatch>()
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null
    private var currentPage = Page.PLAYER
    private var runStartMs = 0L

    private var titleView: TextView? = null
    private var artistView: TextView? = null
    private var phaseView: TextView? = null
    private var trackCountView: TextView? = null
    private var elapsedView: TextView? = null
    private var totalView: TextView? = null
    private var sessionView: TextView? = null
    private var seekBar: SeekBar? = null
    private var playPauseButton: Button? = null
    private var userSeeking = false

    private val handler = Handler(Looper.getMainLooper())
    private val ticker = object : Runnable {
        override fun run() {
            updateDynamicUi()
            handler.postDelayed(this, 500)
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val audioGranted = requiredAudioPermission().let { permission ->
            result[permission] == true || ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
        }
        if (audioGranted) scanLocalMusic() else toast("Audio permission is required to match your 13 approved local tracks.")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(8, 8, 8)
        window.navigationBarColor = Color.rgb(8, 8, 8)
        runStartMs = prefs.getLong("run_start_ms", 0L)
        loadStoredMappings()
        buildShell()
        connectController()
        requestNeededPermissions()
        handler.post(ticker)
    }

    override fun onStop() {
        persistPlaybackState()
        super.onStop()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        controllerFuture?.let { MediaController.releaseFuture(it) }
        controllerFuture = null
        controller = null
        super.onDestroy()
    }

    private fun buildShell() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(8, 8, 8))
        }
        content = FrameLayout(this)
        root.addView(content, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        root.addView(buildBottomNav(), LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(64)))
        setContentView(root)
        showPage(Page.PLAYER)
    }

    private fun buildBottomNav(): View {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(6), dp(8), dp(8))
            setBackgroundColor(Color.rgb(14, 14, 14))
            listOf(
                "PLAYER" to Page.PLAYER,
                "PLAYLIST" to Page.PLAYLIST,
                "RUN" to Page.RUN,
                "SETTINGS" to Page.SETTINGS
            ).forEach { (label, page) ->
                addView(button(label) { showPage(page) }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply {
                    setMargins(dp(3), 0, dp(3), 0)
                })
            }
        }
    }

    private fun showPage(page: Page) {
        currentPage = page
        titleView = null
        artistView = null
        phaseView = null
        trackCountView = null
        elapsedView = null
        totalView = null
        sessionView = null
        seekBar = null
        playPauseButton = null
        content.removeAllViews()
        content.addView(
            when (page) {
                Page.PLAYER -> buildPlayerPage()
                Page.PLAYLIST -> buildPlaylistPage()
                Page.RUN -> buildRunPage()
                Page.SETTINGS -> buildSettingsPage()
            }
        )
        updateDynamicUi()
    }

    private fun buildPlayerPage(): View = scrollColumn().apply {
        addView(header("INFINITE DRIVE", "RUN 45 / FIGHT MODE"))
        addView(text("13 TRACKS  •  ≈45 MIN", 13, Color.LTGRAY, Gravity.CENTER))
        phaseView = text("IGNITION", 16, accent(), Gravity.CENTER, Typeface.BOLD).also { addView(it, topMargin(24)) }
        titleView = text("READY", 28, Color.WHITE, Gravity.CENTER, Typeface.BOLD).also { addView(it, topMargin(18)) }
        artistView = text("Map your local tracks to begin", 16, Color.LTGRAY, Gravity.CENTER).also { addView(it, topMargin(6)) }
        trackCountView = text("TRACK 0 / 13", 13, Color.GRAY, Gravity.CENTER).also { addView(it, topMargin(10)) }

        seekBar = SeekBar(this@MainActivity).apply {
            max = 1000
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) = Unit
                override fun onStartTrackingTouch(seekBar: SeekBar?) { userSeeking = true }
                override fun onStopTrackingTouch(seekBar: SeekBar?) {
                    val c = controller
                    if (c != null && c.duration > 0) c.seekTo(c.duration * (seekBar?.progress ?: 0) / 1000L)
                    userSeeking = false
                }
            })
        }.also { addView(it, topMargin(24)) }

        val times = LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.HORIZONTAL
            elapsedView = text("0:00", 12, Color.LTGRAY).also { addView(it, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)) }
            totalView = text("0:00", 12, Color.LTGRAY, Gravity.END).also { addView(it, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)) }
        }
        addView(times)

        addView(transportRow(), topMargin(20))

        val options = LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            addView(button("SHUFFLE") { toggleShuffle() }, weighted())
            addView(button("REPEAT") { cycleRepeat() }, weighted())
            addView(button("QUEUE") { showPage(Page.PLAYLIST) }, weighted())
        }
        addView(options, topMargin(14))
        addView(volumeControl(), topMargin(14))
        addView(primaryButton("START RUN") { startRun() }, topMargin(24))
        addView(text("In-app playback uses only legally stored local copies of the approved tracks. External providers open the selected song in their authorized app/site.", 12, Color.GRAY, Gravity.CENTER), topMargin(18))
    }

    private fun buildRunPage(): View = scrollColumn().apply {
        addView(header("RUN 45", "FIGHT MODE"))
        phaseView = text("IGNITION", 22, accent(), Gravity.CENTER, Typeface.BOLD).also { addView(it, topMargin(30)) }
        sessionView = text("SESSION 00:00 / 45:00", 15, Color.LTGRAY, Gravity.CENTER).also { addView(it, topMargin(12)) }
        titleView = text("READY", 30, Color.WHITE, Gravity.CENTER, Typeface.BOLD).also { addView(it, topMargin(32)) }
        artistView = text("", 17, Color.LTGRAY, Gravity.CENTER).also { addView(it, topMargin(8)) }
        trackCountView = text("TRACK 0 / 13", 14, Color.GRAY, Gravity.CENTER).also { addView(it, topMargin(12)) }
        addView(transportRow(), topMargin(40))
        addView(primaryButton("END / RESET RUN") {
            runStartMs = 0L
            prefs.edit().remove("run_start_ms").apply()
            controller?.pause()
            updateDynamicUi()
        }, topMargin(28))
    }

    private fun buildPlaylistPage(): View = scrollColumn().apply {
        addView(header("FIGHT MODE", "OFFICIAL 13-TRACK ORDER"))
        FightModeCatalog.tracks.forEachIndexed { index, track ->
            val mapped = matches.containsKey(track.id)
            val playing = controller?.currentMediaItem?.mediaId == track.id
            val status = when {
                playing -> "PLAYING  •  ${track.phase}"
                mapped -> "READY  •  ${track.phase}"
                else -> "LOCAL FILE NOT FOUND  •  ${track.phase}"
            }
            val row = LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(16), dp(13), dp(16), dp(13))
                setBackgroundColor(if (playing) Color.rgb(38, 16, 16) else Color.rgb(18, 18, 18))
                addView(text("${index + 1}. ${track.title}", 17, Color.WHITE, Gravity.START, Typeface.BOLD))
                addView(text(track.artist, 14, Color.LTGRAY), topMargin(3))
                addView(text(status, 11, if (mapped || playing) accent() else Color.GRAY), topMargin(6))
                setOnClickListener { playTrack(track) }
            }
            addView(row, topMargin(8))
        }
        addView(button("RESET ORIGINAL ORDER") {
            controller?.shuffleModeEnabled = false
            buildQueue(force = true)
            toast("Official Fight Mode order restored.")
        }, topMargin(18))
    }

    private fun buildSettingsPage(): View = scrollColumn().apply {
        addView(header("SETTINGS", "MUSIC SOURCE & OWNER CONTROLS"))
        addView(text("MUSIC SOURCE", 13, accent(), Gravity.START, Typeface.BOLD), topMargin(22))
        addView(text("Current: ${sourceMode().name.replace('_', ' ')}", 16, Color.WHITE), topMargin(8))
        addView(button("LOCAL MUSIC — IN-APP PLAYER") { setSource(SourceMode.LOCAL) }, topMargin(10))
        addView(button("SPOTIFY — AUTHORIZED EXTERNAL PLAYBACK") { setSource(SourceMode.SPOTIFY) }, topMargin(8))
        addView(button("YOUTUBE MUSIC — AUTHORIZED EXTERNAL PLAYBACK") { setSource(SourceMode.YOUTUBE_MUSIC) }, topMargin(8))

        addView(text("LOCAL MATCHING", 13, accent(), Gravity.START, Typeface.BOLD), topMargin(26))
        addView(text("${matches.size} / 13 approved tracks matched on this device", 15, Color.LTGRAY), topMargin(8))
        addView(button("RESCAN LOCAL MUSIC") { ensureAudioPermissionThenScan() }, topMargin(10))

        addView(text("OWNER", 13, accent(), Gravity.START, Typeface.BOLD), topMargin(26))
        addView(button("OWNER SETTINGS") { openOwnerGate() }, topMargin(10))
        addView(text("Owner controls are protected by a local PIN. No audio files, passwords, or provider credentials are uploaded by this app.", 12, Color.GRAY), topMargin(10))
    }

    private fun transportRow(): View = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        addView(button("⏮") { controller?.seekToPreviousMediaItem() }, weighted())
        playPauseButton = primaryButton("▶") {
            val c = controller ?: return@primaryButton
            if (c.isPlaying) c.pause() else {
                if (c.mediaItemCount == 0) buildQueue(force = true)
                c.play()
            }
        }.also { addView(it, weighted()) }
        addView(button("⏭") { controller?.seekToNextMediaItem() }, weighted())
    }

    private fun volumeControl(): View {
        val audio = getSystemService(AUDIO_SERVICE) as AudioManager
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(text("VOLUME", 11, Color.GRAY))
            addView(SeekBar(this@MainActivity).apply {
                max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
                progress = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
                setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                    override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                        if (fromUser) audio.setStreamVolume(AudioManager.STREAM_MUSIC, progress, 0)
                    }
                    override fun onStartTrackingTouch(seekBar: SeekBar?) = Unit
                    override fun onStopTrackingTouch(seekBar: SeekBar?) = Unit
                })
            })
        }
    }

    private fun connectController() {
        val token = SessionToken(this, ComponentName(this, PlaybackService::class.java))
        val future = MediaController.Builder(this, token).buildAsync()
        controllerFuture = future
        future.addListener({
            try {
                controller = future.get().also { c ->
                    c.addListener(object : Player.Listener {
                        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                            persistPlaybackState()
                            if (currentPage == Page.PLAYLIST) showPage(Page.PLAYLIST) else updateDynamicUi()
                        }
                        override fun onIsPlayingChanged(isPlaying: Boolean) { updateDynamicUi() }
                        override fun onPlayerError(error: PlaybackException) {
                            toast("Playback error: ${error.errorCodeName}")
                        }
                    })
                }
                if (controller?.mediaItemCount == 0) buildQueue(force = true)
                updateDynamicUi()
            } catch (e: Exception) {
                toast("Player connection failed: ${e.message ?: "unknown error"}")
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun buildQueue(force: Boolean) {
        val c = controller ?: return
        if (!force && c.mediaItemCount > 0) return
        val items = FightModeCatalog.tracks.mapNotNull { track ->
            val match = matches[track.id] ?: return@mapNotNull null
            MediaItem.Builder()
                .setMediaId(track.id)
                .setUri(match.uri)
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle(track.title)
                        .setArtist(track.artist)
                        .setAlbumTitle("INFINITE DRIVE — ${track.phase}")
                        .build()
                )
                .build()
        }
        if (items.isEmpty()) {
            c.clearMediaItems()
            return
        }
        val savedId = prefs.getString("current_media_id", null)
        val savedIndex = items.indexOfFirst { it.mediaId == savedId }.let { if (it >= 0) it else 0 }
        val savedPosition = prefs.getLong("current_position_ms", 0L).coerceAtLeast(0L)
        c.setMediaItems(items, savedIndex, savedPosition)
        c.prepare()
    }

    private fun playTrack(track: TrackSpec) {
        if (sourceMode() != SourceMode.LOCAL) {
            openExternalTrack(track)
            return
        }
        if (!matches.containsKey(track.id)) {
            toast("${track.title} is unavailable locally. Rescan or add a legal copy to your device.")
            return
        }
        val c = controller ?: return
        if (c.mediaItemCount == 0) buildQueue(force = true)
        val index = (0 until c.mediaItemCount).firstOrNull { c.getMediaItemAt(it).mediaId == track.id }
        if (index == null) {
            buildQueue(force = true)
            return playTrack(track)
        }
        c.seekTo(index, 0L)
        c.play()
        showPage(Page.PLAYER)
    }

    private fun startRun() {
        if (sourceMode() != SourceMode.LOCAL) {
            toast("RUN 45 in-app controls require Local Music. External providers are launched per track only.")
            return
        }
        val c = controller ?: return
        if (matches.isEmpty()) {
            toast("No approved local tracks are mapped yet.")
            ensureAudioPermissionThenScan()
            return
        }
        buildQueue(force = true)
        c.seekToDefaultPosition(0)
        c.play()
        runStartMs = System.currentTimeMillis()
        prefs.edit().putLong("run_start_ms", runStartMs).apply()
        showPage(Page.RUN)
    }

    private fun toggleShuffle() {
        val c = controller ?: return
        c.shuffleModeEnabled = !c.shuffleModeEnabled
        toast(if (c.shuffleModeEnabled) "Shuffle ON" else "Official order restored")
    }

    private fun cycleRepeat() {
        val c = controller ?: return
        c.repeatMode = when (c.repeatMode) {
            Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
            Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
            else -> Player.REPEAT_MODE_OFF
        }
        toast(when (c.repeatMode) {
            Player.REPEAT_MODE_ALL -> "Repeat playlist"
            Player.REPEAT_MODE_ONE -> "Repeat track"
            else -> "Repeat off"
        })
    }

    private fun updateDynamicUi() {
        val c = controller
        val id = c?.currentMediaItem?.mediaId
        val track = FightModeCatalog.byId(id)
        val canonicalIndex = FightModeCatalog.tracks.indexOfFirst { it.id == id }.let { if (it >= 0) it + 1 else 0 }
        titleView?.text = track?.title ?: "READY"
        artistView?.text = track?.artist ?: if (matches.isEmpty()) "Map your local tracks to begin" else "Press play to start"
        phaseView?.text = track?.phase ?: "IGNITION"
        trackCountView?.text = "TRACK $canonicalIndex / 13"
        playPauseButton?.text = if (c?.isPlaying == true) "Ⅱ" else "▶"

        val duration = c?.duration?.takeIf { it > 0 && it != C.TIME_UNSET } ?: 0L
        val position = c?.currentPosition?.coerceAtLeast(0L) ?: 0L
        if (!userSeeking && duration > 0) seekBar?.progress = ((position * 1000L) / duration).toInt().coerceIn(0, 1000)
        elapsedView?.text = formatTime(position)
        totalView?.text = formatTime(duration)

        if (runStartMs > 0L) {
            val elapsed = (System.currentTimeMillis() - runStartMs).coerceAtLeast(0L)
            sessionView?.text = "SESSION ${formatTime(elapsed)} / 45:00"
        } else sessionView?.text = "SESSION 00:00 / 45:00"
    }

    private fun persistPlaybackState() {
        val c = controller ?: return
        prefs.edit()
            .putString("current_media_id", c.currentMediaItem?.mediaId)
            .putLong("current_position_ms", c.currentPosition.coerceAtLeast(0L))
            .apply()
    }

    private fun requestNeededPermissions() {
        val permissions = mutableListOf<String>()
        val audio = requiredAudioPermission()
        if (ContextCompat.checkSelfPermission(this, audio) != PackageManager.PERMISSION_GRANTED) permissions += audio
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) permissions += Manifest.permission.POST_NOTIFICATIONS
        if (permissions.isNotEmpty()) permissionLauncher.launch(permissions.toTypedArray()) else scanLocalMusic()
    }

    private fun ensureAudioPermissionThenScan() {
        val audio = requiredAudioPermission()
        if (ContextCompat.checkSelfPermission(this, audio) == PackageManager.PERMISSION_GRANTED) scanLocalMusic()
        else permissionLauncher.launch(arrayOf(audio))
    }

    private fun requiredAudioPermission(): String = if (Build.VERSION.SDK_INT >= 33) Manifest.permission.READ_MEDIA_AUDIO else Manifest.permission.READ_EXTERNAL_STORAGE

    private fun scanLocalMusic() {
        if (ContextCompat.checkSelfPermission(this, requiredAudioPermission()) != PackageManager.PERMISSION_GRANTED) return
        val candidates = mutableListOf<MediaCandidate>()
        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.DURATION
        )
        try {
            contentResolver.query(
                MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                projection,
                "${MediaStore.Audio.Media.IS_MUSIC} != 0",
                null,
                null
            )?.use { cursor ->
                val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                val artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                val durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                while (cursor.moveToNext()) {
                    val uri = Uri.withAppendedPath(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, cursor.getLong(idCol).toString())
                    candidates += MediaCandidate(
                        cursor.getString(titleCol).orEmpty(),
                        cursor.getString(artistCol).orEmpty(),
                        uri,
                        cursor.getLong(durationCol)
                    )
                }
            }
        } catch (e: SecurityException) {
            toast("Audio access denied.")
            return
        }

        matches.clear()
        FightModeCatalog.tracks.forEach { track ->
            val expectedTitle = normalize(track.title)
            val expectedArtist = normalize(track.artist)
            val best = candidates.firstOrNull { candidate ->
                val title = normalize(candidate.title)
                val artist = normalize(candidate.artist)
                (title == expectedTitle || title.contains(expectedTitle) || expectedTitle.contains(title)) &&
                    (artist.contains(expectedArtist) || expectedArtist.contains(artist))
            }
            if (best != null) matches[track.id] = LocalMatch(best.uri, best.durationMs)
        }
        saveMappings()
        buildQueue(force = true)
        if (currentPage == Page.PLAYLIST || currentPage == Page.SETTINGS) showPage(currentPage) else updateDynamicUi()
        toast("Matched ${matches.size} of 13 approved tracks.")
    }

    private fun normalize(value: String): String = value.lowercase(Locale.ROOT).filter { it.isLetterOrDigit() }

    private fun loadStoredMappings() {
        FightModeCatalog.tracks.forEach { track ->
            val uri = prefs.getString("track_uri_${track.id}", null)
            if (uri != null) matches[track.id] = LocalMatch(Uri.parse(uri), prefs.getLong("track_duration_${track.id}", 0L))
        }
    }

    private fun saveMappings() {
        val edit = prefs.edit()
        FightModeCatalog.tracks.forEach { track ->
            val match = matches[track.id]
            if (match == null) {
                edit.remove("track_uri_${track.id}").remove("track_duration_${track.id}")
            } else {
                edit.putString("track_uri_${track.id}", match.uri.toString())
                edit.putLong("track_duration_${track.id}", match.durationMs)
            }
        }
        edit.apply()
    }

    private fun sourceMode(): SourceMode = runCatching { SourceMode.valueOf(prefs.getString("source_mode", SourceMode.LOCAL.name) ?: SourceMode.LOCAL.name) }.getOrDefault(SourceMode.LOCAL)

    private fun setSource(mode: SourceMode) {
        prefs.edit().putString("source_mode", mode.name).apply()
        toast("Music source: ${mode.name.replace('_', ' ')}")
        showPage(Page.SETTINGS)
    }

    private fun openExternalTrack(track: TrackSpec) {
        val query = Uri.encode("${track.artist} ${track.title}")
        when (sourceMode()) {
            SourceMode.SPOTIFY -> {
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("spotify:search:$query")))
                } catch (_: ActivityNotFoundException) {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://open.spotify.com/search/$query")))
                }
            }
            SourceMode.YOUTUBE_MUSIC -> startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://music.youtube.com/search?q=$query")))
            SourceMode.LOCAL -> Unit
        }
    }

    private fun openOwnerGate() {
        val stored = prefs.getString("owner_pin_hash", null)
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = if (stored == null) "Create 4+ digit owner PIN" else "Owner PIN"
        }
        AlertDialog.Builder(this)
            .setTitle(if (stored == null) "Create Owner PIN" else "Owner Access")
            .setView(input)
            .setNegativeButton("Cancel", null)
            .setPositiveButton(if (stored == null) "Create" else "Unlock") { _, _ ->
                val pin = input.text.toString()
                if (pin.length < 4) {
                    toast("PIN must be at least 4 digits.")
                    return@setPositiveButton
                }
                val hash = sha256(pin)
                if (stored == null) {
                    prefs.edit().putString("owner_pin_hash", hash).apply()
                    showOwnerSettings()
                } else if (hash == stored) showOwnerSettings() else toast("Incorrect owner PIN.")
            }
            .show()
    }

    private fun showOwnerSettings() {
        val actions = arrayOf("Rescan approved tracks", "Clear track mappings", "Reset RUN session", "Restore Local Music source", "Change owner PIN")
        AlertDialog.Builder(this)
            .setTitle("OWNER SETTINGS")
            .setItems(actions) { _, which ->
                when (which) {
                    0 -> ensureAudioPermissionThenScan()
                    1 -> {
                        matches.clear()
                        saveMappings()
                        controller?.clearMediaItems()
                        showPage(Page.SETTINGS)
                    }
                    2 -> {
                        runStartMs = 0L
                        prefs.edit().remove("run_start_ms").apply()
                    }
                    3 -> setSource(SourceMode.LOCAL)
                    4 -> {
                        prefs.edit().remove("owner_pin_hash").apply()
                        toast("Owner PIN cleared. Open Owner Settings to create a new PIN.")
                    }
                }
            }
            .setNegativeButton("Close", null)
            .show()
    }

    private fun sha256(value: String): String = MessageDigest.getInstance("SHA-256")
        .digest(value.toByteArray())
        .joinToString("") { "%02x".format(it) }

    private fun scrollColumn(): LinearLayout {
        val column = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(18), dp(18), dp(30))
        }
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            addView(column, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        }
        content.post {
            if (column.parent == null) Unit
        }
        return object : LinearLayout(this) {
            init {
                orientation = VERTICAL
                addView(scroll, LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
            }

            override fun addView(child: View?) {
                column.addView(child)
            }

            override fun addView(child: View?, params: ViewGroup.LayoutParams?) {
                column.addView(child, params)
            }
        }
    }

    private fun header(title: String, subtitle: String): View = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        addView(text(title, 30, Color.WHITE, Gravity.START, Typeface.BOLD))
        addView(text(subtitle, 13, accent(), Gravity.START, Typeface.BOLD), topMargin(3))
    }

    private fun text(value: String, size: Int, color: Int, gravityValue: Int = Gravity.START, style: Int = Typeface.NORMAL): TextView = TextView(this).apply {
        text = value
        textSize = size.toFloat()
        setTextColor(color)
        gravity = gravityValue
        typeface = Typeface.create(Typeface.DEFAULT, style)
        setLineSpacing(0f, 1.08f)
    }

    private fun button(label: String, action: () -> Unit): Button = Button(this).apply {
        text = label
        textSize = 11f
        setTextColor(Color.WHITE)
        setBackgroundColor(Color.rgb(30, 30, 30))
        isAllCaps = false
        setOnClickListener { action() }
    }

    private fun primaryButton(label: String, action: () -> Unit): Button = button(label, action).apply {
        setBackgroundColor(accent())
        setTextColor(Color.WHITE)
        textSize = 13f
        typeface = Typeface.DEFAULT_BOLD
    }

    private fun topMargin(value: Int): LinearLayout.LayoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
        topMargin = dp(value)
    }

    private fun weighted(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(0, dp(52), 1f).apply {
        setMargins(dp(4), 0, dp(4), 0)
    }

    private fun accent(): Int = Color.rgb(227, 54, 54)
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun formatTime(ms: Long): String {
        if (ms <= 0) return "0:00"
        val totalSeconds = ms / 1000
        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60
        return "%d:%02d".format(minutes, seconds)
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}
