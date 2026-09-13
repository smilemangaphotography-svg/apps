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
    private data class Candidate(val title: String, val artist: String, val uri: Uri, val durationMs: Long)

    private lateinit var content: FrameLayout
    private val prefs by lazy { getSharedPreferences("infinite_drive", MODE_PRIVATE) }
    private val matches = mutableMapOf<String, LocalMatch>()
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null
    private var page = Page.PLAYER
    private var runStartMs = 0L
    private var titleView: TextView? = null
    private var artistView: TextView? = null
    private var phaseView: TextView? = null
    private var trackView: TextView? = null
    private var elapsedView: TextView? = null
    private var totalView: TextView? = null
    private var sessionView: TextView? = null
    private var seekBar: SeekBar? = null
    private var playButton: Button? = null
    private var userSeeking = false

    private val handler = Handler(Looper.getMainLooper())
    private val ticker = object : Runnable {
        override fun run() {
            updateDynamicUi()
            handler.postDelayed(this, 500)
        }
    }

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        if (hasAudioPermission()) scanLocalMusic() else toast("Audio permission is required to match the approved playlist.")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = bg()
        window.navigationBarColor = bg()
        runStartMs = prefs.getLong("run_start_ms", 0L)
        loadMappings()
        buildShell()
        connectController()
        requestPermissionsIfNeeded()
        handler.post(ticker)
    }

    override fun onStop() {
        persistPlaybackState()
        super.onStop()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        controllerFuture?.let(MediaController::releaseFuture)
        controllerFuture = null
        controller = null
        super.onDestroy()
    }

    private fun buildShell() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(bg())
        }
        content = FrameLayout(this)
        root.addView(content, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        root.addView(bottomNav(), LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(64)))
        setContentView(root)
        showPage(Page.PLAYER)
    }

    private fun bottomNav() = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        setPadding(dp(6), dp(6), dp(6), dp(8))
        setBackgroundColor(Color.rgb(14, 14, 14))
        listOf("PLAYER" to Page.PLAYER, "PLAYLIST" to Page.PLAYLIST, "RUN" to Page.RUN, "SETTINGS" to Page.SETTINGS).forEach { (label, target) ->
            addView(button(label) { showPage(target) }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply {
                setMargins(dp(3), 0, dp(3), 0)
            })
        }
    }

    private fun showPage(target: Page) {
        page = target
        titleView = null; artistView = null; phaseView = null; trackView = null
        elapsedView = null; totalView = null; sessionView = null; seekBar = null; playButton = null
        val column = when (target) {
            Page.PLAYER -> playerPage()
            Page.PLAYLIST -> playlistPage()
            Page.RUN -> runPage()
            Page.SETTINGS -> settingsPage()
        }
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            addView(column, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        }
        content.removeAllViews()
        content.addView(scroll, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        updateDynamicUi()
    }

    private fun pageColumn() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(18), dp(18), dp(18), dp(30))
    }

    private fun playerPage() = pageColumn().apply {
        addView(header("INFINITE DRIVE", "RUN 45 / FIGHT MODE"))
        addView(text("13 TRACKS  •  ≈45 MIN", 13, Color.LTGRAY, Gravity.CENTER), mt(6))
        phaseView = text("IGNITION", 16, accent(), Gravity.CENTER, Typeface.BOLD).also { addView(it, mt(26)) }
        titleView = text("READY", 28, Color.WHITE, Gravity.CENTER, Typeface.BOLD).also { addView(it, mt(16)) }
        artistView = text("Map your local tracks to begin", 16, Color.LTGRAY, Gravity.CENTER).also { addView(it, mt(6)) }
        trackView = text("TRACK 0 / 13", 13, Color.GRAY, Gravity.CENTER).also { addView(it, mt(10)) }
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
        }.also { addView(it, mt(20)) }
        addView(LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.HORIZONTAL
            elapsedView = text("0:00", 12, Color.LTGRAY).also { addView(it, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)) }
            totalView = text("0:00", 12, Color.LTGRAY, Gravity.END).also { addView(it, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)) }
        })
        addView(transport(), mt(20))
        addView(LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(button("SHUFFLE") { toggleShuffle() }, weighted())
            addView(button("REPEAT") { cycleRepeat() }, weighted())
            addView(button("QUEUE") { showPage(Page.PLAYLIST) }, weighted())
        }, mt(12))
        addView(volumeControl(), mt(12))
        addView(primaryButton("START RUN") { startRun() }, mt(22))
        addView(text("Only the approved 13 tracks are recognized. No copyrighted recordings are bundled with the app.", 12, Color.GRAY, Gravity.CENTER), mt(16))
    }

    private fun runPage() = pageColumn().apply {
        addView(header("RUN 45", "FIGHT MODE"))
        phaseView = text("IGNITION", 22, accent(), Gravity.CENTER, Typeface.BOLD).also { addView(it, mt(32)) }
        sessionView = text("SESSION 00:00 / 45:00", 15, Color.LTGRAY, Gravity.CENTER).also { addView(it, mt(12)) }
        titleView = text("READY", 30, Color.WHITE, Gravity.CENTER, Typeface.BOLD).also { addView(it, mt(34)) }
        artistView = text("", 17, Color.LTGRAY, Gravity.CENTER).also { addView(it, mt(8)) }
        trackView = text("TRACK 0 / 13", 14, Color.GRAY, Gravity.CENTER).also { addView(it, mt(12)) }
        addView(transport(), mt(40))
        addView(primaryButton("END / RESET RUN") {
            runStartMs = 0L
            prefs.edit().remove("run_start_ms").apply()
            controller?.pause()
            updateDynamicUi()
        }, mt(28))
    }

    private fun playlistPage() = pageColumn().apply {
        addView(header("FIGHT MODE", "OFFICIAL 13-TRACK ORDER"))
        FightModeCatalog.tracks.forEachIndexed { index, track ->
            val mapped = matches.containsKey(track.id)
            val playing = controller?.currentMediaItem?.mediaId == track.id
            val status = when { playing -> "PLAYING"; mapped -> "READY"; else -> "LOCAL FILE NOT FOUND" }
            addView(LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(14), dp(12), dp(14), dp(12))
                setBackgroundColor(if (playing) Color.rgb(38, 16, 16) else Color.rgb(18, 18, 18))
                addView(text("${index + 1}. ${track.title}", 17, Color.WHITE, style = Typeface.BOLD))
                addView(text(track.artist, 14, Color.LTGRAY), mt(3))
                addView(text("$status  •  ${track.phase}", 11, if (mapped || playing) accent() else Color.GRAY), mt(5))
                setOnClickListener { playTrack(track) }
            }, mt(8))
        }
        addView(button("RESET ORIGINAL ORDER") {
            controller?.shuffleModeEnabled = false
            buildQueue(true)
            toast("Official Fight Mode order restored.")
        }, mt(18))
    }

    private fun settingsPage() = pageColumn().apply {
        addView(header("SETTINGS", "MUSIC SOURCE & OWNER CONTROLS"))
        addView(text("MUSIC SOURCE", 13, accent(), style = Typeface.BOLD), mt(24))
        addView(text("Current: ${sourceMode().name.replace('_', ' ')}", 16, Color.WHITE), mt(8))
        addView(button("LOCAL MUSIC — IN-APP PLAYER") { setSource(SourceMode.LOCAL) }, mt(10))
        addView(button("SPOTIFY — AUTHORIZED EXTERNAL PLAYBACK") { setSource(SourceMode.SPOTIFY) }, mt(8))
        addView(button("YOUTUBE MUSIC — AUTHORIZED EXTERNAL PLAYBACK") { setSource(SourceMode.YOUTUBE_MUSIC) }, mt(8))
        addView(text("LOCAL MATCHING", 13, accent(), style = Typeface.BOLD), mt(26))
        addView(text("${matches.size} / 13 approved tracks matched on this device", 15, Color.LTGRAY), mt(8))
        addView(button("RESCAN LOCAL MUSIC") { ensurePermissionThenScan() }, mt(10))
        addView(text("OWNER", 13, accent(), style = Typeface.BOLD), mt(26))
        addView(button("OWNER SETTINGS") { ownerGate() }, mt(10))
        addView(text("Owner settings use a local PIN. Audio files and credentials are never uploaded by this app.", 12, Color.GRAY), mt(10))
    }

    private fun transport() = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        addView(button("⏮") { controller?.seekToPreviousMediaItem() }, weighted())
        playButton = primaryButton("▶") {
            val c = controller ?: return@primaryButton
            if (c.isPlaying) c.pause() else {
                if (c.mediaItemCount == 0) buildQueue(true)
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
                            if (page == Page.PLAYLIST) showPage(Page.PLAYLIST) else updateDynamicUi()
                        }
                        override fun onIsPlayingChanged(isPlaying: Boolean) = updateDynamicUi()
                        override fun onPlayerError(error: PlaybackException) = toast("Playback error: ${error.errorCodeName}")
                    })
                }
                if (controller?.mediaItemCount == 0) buildQueue(true)
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
            MediaItem.Builder().setMediaId(track.id).setUri(match.uri).setMediaMetadata(
                MediaMetadata.Builder().setTitle(track.title).setArtist(track.artist).setAlbumTitle("INFINITE DRIVE — ${track.phase}").build()
            ).build()
        }
        if (items.isEmpty()) {
            c.clearMediaItems()
            return
        }
        val savedId = prefs.getString("current_media_id", null)
        val index = items.indexOfFirst { it.mediaId == savedId }.let { if (it >= 0) it else 0 }
        c.setMediaItems(items, index, prefs.getLong("current_position_ms", 0L).coerceAtLeast(0L))
        c.prepare()
    }

    private fun playTrack(track: TrackSpec) {
        if (sourceMode() != SourceMode.LOCAL) return openExternal(track)
        if (!matches.containsKey(track.id)) {
            toast("${track.title} is unavailable locally. Add a legal copy and rescan.")
            return
        }
        val c = controller ?: return
        if (c.mediaItemCount == 0) buildQueue(true)
        val index = (0 until c.mediaItemCount).firstOrNull { c.getMediaItemAt(it).mediaId == track.id }
        if (index == null) {
            buildQueue(true)
            return
        }
        c.seekTo(index, 0L)
        c.play()
        showPage(Page.PLAYER)
    }

    private fun startRun() {
        if (sourceMode() != SourceMode.LOCAL) {
            toast("RUN 45 in-app controls require Local Music. External providers launch one approved track at a time.")
            return
        }
        if (matches.isEmpty()) {
            toast("No approved local tracks are mapped yet.")
            ensurePermissionThenScan()
            return
        }
        val c = controller ?: return
        buildQueue(true)
        c.seekToDefaultPosition(0)
        c.play()
        runStartMs = System.currentTimeMillis()
        prefs.edit().putLong("run_start_ms", runStartMs).apply()
        showPage(Page.RUN)
    }

    private fun toggleShuffle() {
        controller?.let {
            it.shuffleModeEnabled = !it.shuffleModeEnabled
            toast(if (it.shuffleModeEnabled) "Shuffle ON" else "Official order restored")
        }
    }

    private fun cycleRepeat() {
        controller?.let { c ->
            c.repeatMode = when (c.repeatMode) {
                Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
                Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
                else -> Player.REPEAT_MODE_OFF
            }
            toast(when (c.repeatMode) { Player.REPEAT_MODE_ALL -> "Repeat playlist"; Player.REPEAT_MODE_ONE -> "Repeat track"; else -> "Repeat off" })
        }
    }

    private fun updateDynamicUi() {
        val c = controller
        val id = c?.currentMediaItem?.mediaId
        val track = FightModeCatalog.byId(id)
        val index = FightModeCatalog.tracks.indexOfFirst { it.id == id }.let { if (it >= 0) it + 1 else 0 }
        titleView?.text = track?.title ?: "READY"
        artistView?.text = track?.artist ?: if (matches.isEmpty()) "Map your local tracks to begin" else "Press play to start"
        phaseView?.text = track?.phase ?: "IGNITION"
        trackView?.text = "TRACK $index / 13"
        playButton?.text = if (c?.isPlaying == true) "Ⅱ" else "▶"
        val duration = c?.duration?.takeIf { it > 0 && it != C.TIME_UNSET } ?: 0L
        val position = c?.currentPosition?.coerceAtLeast(0L) ?: 0L
        if (!userSeeking && duration > 0) seekBar?.progress = ((position * 1000L) / duration).toInt().coerceIn(0, 1000)
        elapsedView?.text = formatTime(position)
        totalView?.text = formatTime(duration)
        sessionView?.text = if (runStartMs > 0) "SESSION ${formatTime((System.currentTimeMillis() - runStartMs).coerceAtLeast(0L))} / 45:00" else "SESSION 00:00 / 45:00"
    }

    private fun persistPlaybackState() {
        controller?.let { c ->
            prefs.edit().putString("current_media_id", c.currentMediaItem?.mediaId).putLong("current_position_ms", c.currentPosition.coerceAtLeast(0L)).apply()
        }
    }

    private fun requestPermissionsIfNeeded() {
        val needed = mutableListOf<String>()
        if (!hasAudioPermission()) needed += audioPermission()
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) needed += Manifest.permission.POST_NOTIFICATIONS
        if (needed.isEmpty()) scanLocalMusic() else permissionLauncher.launch(needed.toTypedArray())
    }

    private fun ensurePermissionThenScan() {
        if (hasAudioPermission()) scanLocalMusic() else permissionLauncher.launch(arrayOf(audioPermission()))
    }

    private fun audioPermission() = if (Build.VERSION.SDK_INT >= 33) Manifest.permission.READ_MEDIA_AUDIO else Manifest.permission.READ_EXTERNAL_STORAGE
    private fun hasAudioPermission() = ContextCompat.checkSelfPermission(this, audioPermission()) == PackageManager.PERMISSION_GRANTED

    private fun scanLocalMusic() {
        if (!hasAudioPermission()) return
        val candidates = mutableListOf<Candidate>()
        val projection = arrayOf(MediaStore.Audio.Media._ID, MediaStore.Audio.Media.TITLE, MediaStore.Audio.Media.ARTIST, MediaStore.Audio.Media.DURATION)
        try {
            contentResolver.query(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, projection, "${MediaStore.Audio.Media.IS_MUSIC} != 0", null, null)?.use { cursor ->
                val id = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val title = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                val artist = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                val duration = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                while (cursor.moveToNext()) {
                    candidates += Candidate(
                        cursor.getString(title).orEmpty(),
                        cursor.getString(artist).orEmpty(),
                        Uri.withAppendedPath(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, cursor.getLong(id).toString()),
                        cursor.getLong(duration)
                    )
                }
            }
        } catch (_: SecurityException) {
            toast("Audio access denied.")
            return
        }
        matches.clear()
        FightModeCatalog.tracks.forEach { track ->
            val t = normalize(track.title)
            val a = normalize(track.artist)
            candidates.firstOrNull { c ->
                val ct = normalize(c.title); val ca = normalize(c.artist)
                (ct == t || ct.contains(t) || t.contains(ct)) && (ca.contains(a) || a.contains(ca))
            }?.let { matches[track.id] = LocalMatch(it.uri, it.durationMs) }
        }
        saveMappings()
        buildQueue(true)
        if (page == Page.PLAYLIST || page == Page.SETTINGS) showPage(page) else updateDynamicUi()
        toast("Matched ${matches.size} of 13 approved tracks.")
    }

    private fun normalize(value: String) = value.lowercase(Locale.ROOT).filter(Char::isLetterOrDigit)

    private fun loadMappings() {
        FightModeCatalog.tracks.forEach { track ->
            prefs.getString("track_uri_${track.id}", null)?.let { matches[track.id] = LocalMatch(Uri.parse(it), prefs.getLong("track_duration_${track.id}", 0L)) }
        }
    }

    private fun saveMappings() {
        val e = prefs.edit()
        FightModeCatalog.tracks.forEach { track ->
            matches[track.id]?.let {
                e.putString("track_uri_${track.id}", it.uri.toString()).putLong("track_duration_${track.id}", it.durationMs)
            } ?: e.remove("track_uri_${track.id}").remove("track_duration_${track.id}")
        }
        e.apply()
    }

    private fun sourceMode() = runCatching { SourceMode.valueOf(prefs.getString("source_mode", SourceMode.LOCAL.name) ?: SourceMode.LOCAL.name) }.getOrDefault(SourceMode.LOCAL)

    private fun setSource(mode: SourceMode) {
        prefs.edit().putString("source_mode", mode.name).apply()
        toast("Music source: ${mode.name.replace('_', ' ')}")
        showPage(Page.SETTINGS)
    }

    private fun openExternal(track: TrackSpec) {
        val q = Uri.encode("${track.artist} ${track.title}")
        when (sourceMode()) {
            SourceMode.SPOTIFY -> try {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("spotify:search:$q")))
            } catch (_: ActivityNotFoundException) {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://open.spotify.com/search/$q")))
            }
            SourceMode.YOUTUBE_MUSIC -> startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://music.youtube.com/search?q=$q")))
            SourceMode.LOCAL -> Unit
        }
    }

    private fun ownerGate() {
        val stored = prefs.getString("owner_pin_hash", null)
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = if (stored == null) "Create 4+ digit owner PIN" else "Owner PIN"
        }
        AlertDialog.Builder(this).setTitle(if (stored == null) "Create Owner PIN" else "Owner Access").setView(input).setNegativeButton("Cancel", null)
            .setPositiveButton(if (stored == null) "Create" else "Unlock") { _, _ ->
                val pin = input.text.toString()
                if (pin.length < 4) toast("PIN must be at least 4 digits.")
                else if (stored == null) {
                    prefs.edit().putString("owner_pin_hash", sha256(pin)).apply(); ownerSettings()
                } else if (sha256(pin) == stored) ownerSettings() else toast("Incorrect owner PIN.")
            }.show()
    }

    private fun ownerSettings() {
        val actions = arrayOf("Rescan approved tracks", "Clear track mappings", "Reset RUN session", "Restore Local Music source", "Change owner PIN")
        AlertDialog.Builder(this).setTitle("OWNER SETTINGS").setItems(actions) { _, which ->
            when (which) {
                0 -> ensurePermissionThenScan()
                1 -> { matches.clear(); saveMappings(); controller?.clearMediaItems(); showPage(Page.SETTINGS) }
                2 -> { runStartMs = 0L; prefs.edit().remove("run_start_ms").apply() }
                3 -> setSource(SourceMode.LOCAL)
                4 -> { prefs.edit().remove("owner_pin_hash").apply(); toast("Owner PIN cleared.") }
            }
        }.setNegativeButton("Close", null).show()
    }

    private fun sha256(value: String) = MessageDigest.getInstance("SHA-256").digest(value.toByteArray()).joinToString("") { "%02x".format(it) }

    private fun header(title: String, subtitle: String) = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        addView(text(title, 30, Color.WHITE, style = Typeface.BOLD))
        addView(text(subtitle, 13, accent(), style = Typeface.BOLD), mt(3))
    }

    private fun text(value: String, size: Int, color: Int, gravityValue: Int = Gravity.START, style: Int = Typeface.NORMAL) = TextView(this).apply {
        text = value; textSize = size.toFloat(); setTextColor(color); gravity = gravityValue; typeface = Typeface.create(Typeface.DEFAULT, style); setLineSpacing(0f, 1.08f)
    }

    private fun button(label: String, action: () -> Unit) = Button(this).apply {
        text = label; textSize = 11f; setTextColor(Color.WHITE); setBackgroundColor(Color.rgb(30, 30, 30)); isAllCaps = false; setOnClickListener { action() }
    }

    private fun primaryButton(label: String, action: () -> Unit) = button(label, action).apply {
        setBackgroundColor(accent()); textSize = 13f; typeface = Typeface.DEFAULT_BOLD
    }

    private fun mt(value: Int) = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(value) }
    private fun weighted() = LinearLayout.LayoutParams(0, dp(52), 1f).apply { setMargins(dp(4), 0, dp(4), 0) }
    private fun bg() = Color.rgb(8, 8, 8)
    private fun accent() = Color.rgb(227, 54, 54)
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
    private fun formatTime(ms: Long): String { val s = (ms.coerceAtLeast(0) / 1000); return "%d:%02d".format(s / 60, s % 60) }
    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}
