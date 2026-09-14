package eu.infinitedrive.app

import android.Manifest
import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.ContentUris
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
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
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
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
    private enum class SourceMode { NONE, LOCAL, SPOTIFY, YOUTUBE_MUSIC }

    private data class LocalMatch(val uri: Uri, val durationMs: Long)
    private data class Candidate(val title: String, val artist: String, val uri: Uri, val durationMs: Long)

    private lateinit var content: FrameLayout
    private lateinit var navBar: LinearLayout

    private val prefs by lazy { getSharedPreferences("infinite_drive", MODE_PRIVATE) }
    private val matches = mutableMapOf<String, LocalMatch>()
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null
    private var page = Page.PLAYER
    private var runStartMs = 0L
    private var userSeeking = false

    private var titleView: TextView? = null
    private var artistView: TextView? = null
    private var phaseView: TextView? = null
    private var trackView: TextView? = null
    private var elapsedView: TextView? = null
    private var totalView: TextView? = null
    private var sessionView: TextView? = null
    private var seekBar: SeekBar? = null
    private var playButton: Button? = null

    private val handler = Handler(Looper.getMainLooper())
    private val ticker = object : Runnable {
        override fun run() {
            updateDynamicUi()
            handler.postDelayed(this, 500)
        }
    }

    private val localPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        if (hasAudioPermission()) scanLocalMusic()
        else toast("Music access was not granted. Choose Spotify/YouTube Music or allow Local Music access.")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        runStartMs = prefs.getLong("run_start_ms", 0L)
        loadMappings()
        buildShell()
        connectController()
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

        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(0, bars.top, 0, bars.bottom)
            insets
        }

        content = FrameLayout(this)
        navBar = bottomNav()

        root.addView(content, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        root.addView(navBar, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(68)))

        setContentView(root)
        ViewCompat.requestApplyInsets(root)
        showPage(Page.PLAYER)
    }

    private fun bottomNav() = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        setPadding(dp(8), dp(7), dp(8), dp(8))
        setBackgroundColor(Color.rgb(13, 13, 13))

        listOf("PLAYER", "PLAYLIST", "RUN", "SETTINGS").forEach { label ->
            addView(Button(this@MainActivity).apply {
                text = label
                textSize = 11f
                isAllCaps = false
                setOnClickListener {
                    showPage(
                        when (label) {
                            "PLAYER" -> Page.PLAYER
                            "PLAYLIST" -> Page.PLAYLIST
                            "RUN" -> Page.RUN
                            else -> Page.SETTINGS
                        }
                    )
                }
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply {
                setMargins(dp(3), 0, dp(3), 0)
            })
        }
    }

    private fun refreshNav() {
        val targets = listOf(Page.PLAYER, Page.PLAYLIST, Page.RUN, Page.SETTINGS)
        for (i in 0 until navBar.childCount) {
            val button = navBar.getChildAt(i) as? Button ?: continue
            val active = targets.getOrNull(i) == page
            button.setTextColor(if (active) accent() else Color.rgb(190, 190, 190))
            button.typeface = Typeface.create(Typeface.DEFAULT, if (active) Typeface.BOLD else Typeface.NORMAL)
            button.background = rounded(if (active) Color.rgb(36, 16, 16) else Color.rgb(24, 24, 24), 12)
        }
    }

    private fun showPage(target: Page) {
        page = target
        titleView = null
        artistView = null
        phaseView = null
        trackView = null
        elapsedView = null
        totalView = null
        sessionView = null
        seekBar = null
        playButton = null

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
        refreshNav()
        updateDynamicUi()
    }

    private fun pageColumn() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(18), dp(14), dp(18), dp(22))
    }

    private fun playerPage() = pageColumn().apply {
        addView(header("INFINITE DRIVE", "RUN 45 / FIGHT MODE"))
        addView(text("13 TRACKS  •  ≈50 MIN", 13, Color.rgb(205, 205, 205), Gravity.CENTER), mt(5))
        addView(sourcePill(), mt(12))
        addView(fightModeCard(), mt(14))

        when (sourceMode()) {
            SourceMode.NONE -> {
                addView(text("YOUR FIGHT MODE IS READY", 20, Color.WHITE, Gravity.CENTER, Typeface.BOLD), mt(18))
                addView(text("Choose where the approved 13 tracks will play. Local Music gives full in-app playback.", 14, Color.rgb(180, 180, 180), Gravity.CENTER), mt(7))
                addView(primaryButton("CONNECT MUSIC") { showSourceChooser() }, mt(16))
            }
            SourceMode.LOCAL -> {
                if (matches.size < FightModeCatalog.tracks.size) {
                    addView(text("LOCAL MUSIC", 20, Color.WHITE, Gravity.CENTER, Typeface.BOLD), mt(18))
                    addView(text("${matches.size} / ${FightModeCatalog.tracks.size} approved tracks matched", 14, if (matches.size == FightModeCatalog.tracks.size) accent() else Color.rgb(200, 200, 200), Gravity.CENTER), mt(6))
                    addView(text("Add your legal copies to the phone, then scan. Fight Mode starts only when all 13 are matched.", 13, Color.rgb(150, 150, 150), Gravity.CENTER), mt(6))
                    addView(primaryButton(if (matches.isEmpty()) "SCAN LOCAL MUSIC" else "RESCAN LOCAL MUSIC") { requestLocalAccessAndScan() }, mt(14))
                    addView(button("CHANGE MUSIC SOURCE") { showSourceChooser() }, mt(8))
                } else {
                    addPlayerControls()
                }
            }
            SourceMode.SPOTIFY, SourceMode.YOUTUBE_MUSIC -> {
                val provider = if (sourceMode() == SourceMode.SPOTIFY) "SPOTIFY" else "YOUTUBE MUSIC"
                addView(text("$provider SELECTED", 20, Color.WHITE, Gravity.CENTER, Typeface.BOLD), mt(18))
                addView(text("The app keeps the exact 13-track order. Provider playback opens in the authorized provider app; the provider controls the audio.", 13, Color.rgb(170, 170, 170), Gravity.CENTER), mt(7))
                addView(primaryButton("START RUN") { startRun() }, mt(16))
                addView(button("OPEN PLAYLIST ORDER") { showPage(Page.PLAYLIST) }, mt(8))
                addView(button("CHANGE MUSIC SOURCE") { showSourceChooser() }, mt(8))
            }
        }
    }

    private fun LinearLayout.addPlayerControls() {
        phaseView = text("IGNITION", 15, accent(), Gravity.CENTER, Typeface.BOLD).also { addView(it, mt(18)) }
        titleView = text("READY", 26, Color.WHITE, Gravity.CENTER, Typeface.BOLD).also { addView(it, mt(8)) }
        artistView = text("13 / 13 tracks ready", 15, Color.rgb(200, 200, 200), Gravity.CENTER).also { addView(it, mt(4)) }
        trackView = text("TRACK 1 / 13", 12, Color.rgb(130, 130, 130), Gravity.CENTER).also { addView(it, mt(6)) }

        seekBar = SeekBar(this@MainActivity).apply {
            max = 1000
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) = Unit
                override fun onStartTrackingTouch(seekBar: SeekBar?) { userSeeking = true }
                override fun onStopTrackingTouch(seekBar: SeekBar?) {
                    val c = controller
                    if (c != null && c.duration > 0) {
                        c.seekTo(c.duration * (seekBar?.progress ?: 0) / 1000L)
                    }
                    userSeeking = false
                }
            })
        }.also { addView(it, mt(10)) }

        addView(LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.HORIZONTAL
            elapsedView = text("0:00", 12, Color.LTGRAY).also {
                addView(it, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            }
            totalView = text("0:00", 12, Color.LTGRAY, Gravity.END).also {
                addView(it, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            }
        })

        addView(transport(), mt(12))

        addView(LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(button("SHUFFLE") { toggleShuffle() }, weighted())
            addView(button("REPEAT") { cycleRepeat() }, weighted())
            addView(button("QUEUE") { showPage(Page.PLAYLIST) }, weighted())
        }, mt(9))

        addView(volumeControl(), mt(10))
        addView(primaryButton("START RUN") { startRun() }, mt(14))
    }

    private fun fightModeCard(): View = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setPadding(dp(18), dp(17), dp(18), dp(17))
        background = rounded(Color.rgb(20, 20, 20), 20, accent())

        addView(text("⚡", 28, accent(), Gravity.CENTER, Typeface.BOLD))
        addView(text("FIGHT MODE", 24, Color.WHITE, Gravity.CENTER, Typeface.BOLD), mt(4))
        addView(text("RUN 45", 13, accent(), Gravity.CENTER, Typeface.BOLD), mt(3))
        addView(text("LOCKED PLAYLIST  •  13 TRACKS  •  ≈50 MIN", 11, Color.rgb(175, 175, 175), Gravity.CENTER), mt(8))
    }

    private fun sourcePill(): View {
        val label = when (sourceMode()) {
            SourceMode.NONE -> "MUSIC SOURCE  •  NOT CONNECTED"
            SourceMode.LOCAL -> "LOCAL MUSIC  •  ${matches.size}/13 READY"
            SourceMode.SPOTIFY -> "SPOTIFY  •  PROVIDER SELECTED"
            SourceMode.YOUTUBE_MUSIC -> "YOUTUBE MUSIC  •  PROVIDER SELECTED"
        }
        return text(label, 11, if (sourceMode() == SourceMode.NONE) Color.rgb(160, 160, 160) else accent(), Gravity.CENTER, Typeface.BOLD).apply {
            setPadding(dp(12), dp(8), dp(12), dp(8))
            background = rounded(Color.rgb(18, 18, 18), 999)
        }
    }

    private fun runPage() = pageColumn().apply {
        addView(header("RUN 45", "FIGHT MODE"))
        addView(sourcePill(), mt(12))
        phaseView = text("IGNITION", 21, accent(), Gravity.CENTER, Typeface.BOLD).also { addView(it, mt(24)) }
        sessionView = text("SESSION 00:00  •  ≈50:00 PLAYLIST", 14, Color.LTGRAY, Gravity.CENTER).also { addView(it, mt(8)) }

        when (sourceMode()) {
            SourceMode.LOCAL -> {
                titleView = text("READY", 28, Color.WHITE, Gravity.CENTER, Typeface.BOLD).also { addView(it, mt(26)) }
                artistView = text(if (matches.size == 13) "13 / 13 tracks ready" else "${matches.size} / 13 tracks matched", 16, Color.LTGRAY, Gravity.CENTER).also { addView(it, mt(7)) }
                trackView = text("TRACK 0 / 13", 13, Color.GRAY, Gravity.CENTER).also { addView(it, mt(8)) }
                addView(transport(), mt(28))
            }
            SourceMode.SPOTIFY, SourceMode.YOUTUBE_MUSIC -> {
                val provider = if (sourceMode() == SourceMode.SPOTIFY) "Spotify" else "YouTube Music"
                addView(text("$provider controls playback", 20, Color.WHITE, Gravity.CENTER, Typeface.BOLD), mt(26))
                addView(text("Use the locked playlist page to open only the approved tracks in order.", 13, Color.rgb(170, 170, 170), Gravity.CENTER), mt(8))
                addView(primaryButton("OPEN CURRENT / FIRST TRACK") { openExternal(currentTrackOrFirst()) }, mt(18))
                addView(button("VIEW LOCKED PLAYLIST") { showPage(Page.PLAYLIST) }, mt(8))
            }
            SourceMode.NONE -> {
                addView(text("Connect a music source to begin.", 17, Color.LTGRAY, Gravity.CENTER), mt(28))
                addView(primaryButton("CONNECT MUSIC") { showSourceChooser() }, mt(16))
            }
        }

        addView(button("END / RESET RUN") {
            runStartMs = 0L
            prefs.edit().remove("run_start_ms").apply()
            controller?.pause()
            updateDynamicUi()
        }, mt(24))
    }

    private fun playlistPage() = pageColumn().apply {
        addView(header("FIGHT MODE", "OFFICIAL 13-TRACK ORDER"))
        addView(text("≈49:52 total using standard track lengths", 12, Color.rgb(160, 160, 160)), mt(6))
        addView(sourcePill(), mt(12))

        FightModeCatalog.tracks.forEachIndexed { index, track ->
            val mapped = matches.containsKey(track.id)
            val playing = controller?.currentMediaItem?.mediaId == track.id
            val status = when (sourceMode()) {
                SourceMode.NONE -> "CONNECT MUSIC"
                SourceMode.LOCAL -> when {
                    playing -> "PLAYING"
                    mapped -> "READY"
                    else -> "LOCAL FILE NOT FOUND"
                }
                SourceMode.SPOTIFY -> "OPEN IN SPOTIFY"
                SourceMode.YOUTUBE_MUSIC -> "OPEN IN YOUTUBE MUSIC"
            }

            addView(LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(14), dp(11), dp(14), dp(11))
                background = rounded(if (playing) Color.rgb(38, 16, 16) else Color.rgb(18, 18, 18), 14)
                addView(text("${index + 1}. ${track.title}", 16, Color.WHITE, style = Typeface.BOLD))
                addView(text(track.artist, 13, Color.LTGRAY), mt(2))
                addView(text("${formatTrackLength(track.durationSeconds)}  •  ${track.phase}  •  $status", 11, if (playing || mapped || sourceMode() != SourceMode.LOCAL) accent() else Color.GRAY), mt(5))
                setOnClickListener { playTrack(track) }
            }, mt(7))
        }

        if (sourceMode() == SourceMode.LOCAL) {
            addView(button("RESET ORIGINAL ORDER") {
                controller?.shuffleModeEnabled = false
                buildQueue(true)
                toast("Official Fight Mode order restored.")
            }, mt(14))
        }
        addView(button("CHANGE MUSIC SOURCE") { showSourceChooser() }, mt(8))
    }

    private fun settingsPage() = pageColumn().apply {
        addView(header("SETTINGS", "MUSIC SOURCE & OWNER CONTROLS"))
        addView(text("MUSIC SOURCE", 13, accent(), style = Typeface.BOLD), mt(20))
        addView(sourcePill(), mt(8))
        addView(primaryButton("CONNECT / CHANGE MUSIC") { showSourceChooser() }, mt(10))

        addView(text("LOCAL MUSIC", 13, accent(), style = Typeface.BOLD), mt(22))
        addView(text("${matches.size} / 13 approved tracks matched on this device", 14, Color.LTGRAY), mt(7))
        addView(button("SCAN LOCAL MUSIC") { setSource(SourceMode.LOCAL); requestLocalAccessAndScan() }, mt(8))

        addView(text("OWNER", 13, accent(), style = Typeface.BOLD), mt(22))
        addView(button("OWNER SETTINGS") { ownerGate() }, mt(8))
        addView(text("Owner settings use a local PIN. No audio files, passwords, or provider credentials are uploaded.", 12, Color.GRAY), mt(8))
    }

    private fun showSourceChooser() {
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

    private fun transport() = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        addView(button("⏮") { controller?.seekToPreviousMediaItem() }, weighted())
        playButton = primaryButton("▶") {
            val c = controller ?: return@primaryButton
            if (sourceMode() != SourceMode.LOCAL) {
                startRun()
                return@primaryButton
            }
            if (matches.size < 13) {
                toast("Match all 13 local tracks first.")
                return@primaryButton
            }
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

                        override fun onPlayerError(error: PlaybackException) {
                            toast("Playback error: ${error.errorCodeName}")
                        }
                    })
                }

                if (sourceMode() == SourceMode.LOCAL && controller?.mediaItemCount == 0) {
                    buildQueue(true)
                }
                updateDynamicUi()
            } catch (e: Exception) {
                toast("Player connection failed: ${e.message ?: "unknown error"}")
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun buildQueue(force: Boolean) {
        val c = controller ?: return
        if (sourceMode() != SourceMode.LOCAL) return
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
        val index = items.indexOfFirst { it.mediaId == savedId }.let { if (it >= 0) it else 0 }
        val position = prefs.getLong("current_position_ms", 0L).coerceAtLeast(0L)
        c.setMediaItems(items, index, position)
        c.prepare()
    }

    private fun playTrack(track: TrackSpec) {
        when (sourceMode()) {
            SourceMode.NONE -> showSourceChooser()
            SourceMode.SPOTIFY, SourceMode.YOUTUBE_MUSIC -> openExternal(track)
            SourceMode.LOCAL -> {
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
        }
    }

    private fun startRun() {
        when (sourceMode()) {
            SourceMode.NONE -> {
                showSourceChooser()
                return
            }
            SourceMode.LOCAL -> {
                if (matches.size < FightModeCatalog.tracks.size) {
                    toast("Fight Mode needs all 13 approved local tracks. ${matches.size}/13 are matched.")
                    requestLocalAccessAndScan()
                    return
                }
                val c = controller ?: return
                buildQueue(true)
                c.seekToDefaultPosition(0)
                c.play()
            }
            SourceMode.SPOTIFY, SourceMode.YOUTUBE_MUSIC -> {
                openExternal(FightModeCatalog.tracks.first())
            }
        }

        runStartMs = System.currentTimeMillis()
        prefs.edit().putLong("run_start_ms", runStartMs).apply()
        showPage(Page.RUN)
    }

    private fun currentTrackOrFirst(): TrackSpec {
        return FightModeCatalog.byId(controller?.currentMediaItem?.mediaId) ?: FightModeCatalog.tracks.first()
    }

    private fun toggleShuffle() {
        val c = controller ?: return
        c.shuffleModeEnabled = !c.shuffleModeEnabled
        toast(if (c.shuffleModeEnabled) "Shuffle ON" else "Official order restored")
        if (!c.shuffleModeEnabled) buildQueue(true)
    }

    private fun cycleRepeat() {
        val c = controller ?: return
        c.repeatMode = when (c.repeatMode) {
            Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
            Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
            else -> Player.REPEAT_MODE_OFF
        }
        toast(
            when (c.repeatMode) {
                Player.REPEAT_MODE_ALL -> "Repeat playlist"
                Player.REPEAT_MODE_ONE -> "Repeat track"
                else -> "Repeat off"
            }
        )
    }

    private fun updateDynamicUi() {
        val c = controller
        val track = FightModeCatalog.byId(c?.currentMediaItem?.mediaId)
        val index = if (c != null && c.currentMediaItemIndex >= 0) c.currentMediaItemIndex else 0

        if (sourceMode() == SourceMode.LOCAL && matches.size == 13 && track == null) {
            val first = FightModeCatalog.tracks.first()
            phaseView?.text = first.phase
            titleView?.text = "READY"
            artistView?.text = "13 / 13 tracks ready"
            trackView?.text = "TRACK 1 / 13"
        } else if (track != null) {
            phaseView?.text = track.phase
            titleView?.text = track.title
            artistView?.text = track.artist
            trackView?.text = "TRACK ${index + 1} / 13"
        }

        if (c != null) {
            val position = c.currentPosition.coerceAtLeast(0L)
            val duration = c.duration
            elapsedView?.text = formatTime(position)
            totalView?.text = if (duration > 0) formatTime(duration) else "0:00"
            if (!userSeeking && duration > 0) {
                seekBar?.progress = ((position * 1000L) / duration).toInt().coerceIn(0, 1000)
            }
            playButton?.text = if (c.isPlaying) "Ⅱ" else "▶"
        }

        if (runStartMs > 0L) {
            val elapsed = (System.currentTimeMillis() - runStartMs).coerceAtLeast(0L)
            sessionView?.text = "SESSION ${formatTime(elapsed)}  •  ≈49:52 PLAYLIST"
        }
    }

    private fun requestLocalAccessAndScan() {
        if (hasAudioPermission()) {
            scanLocalMusic()
        } else {
            localPermissionLauncher.launch(requiredLocalPermissions())
        }
    }

    private fun requiredLocalPermissions(): Array<String> {
        val permissions = mutableListOf<String>()
        permissions += if (Build.VERSION.SDK_INT >= 33) Manifest.permission.READ_MEDIA_AUDIO else Manifest.permission.READ_EXTERNAL_STORAGE
        if (Build.VERSION.SDK_INT >= 33) permissions += Manifest.permission.POST_NOTIFICATIONS
        return permissions.toTypedArray()
    }

    private fun hasAudioPermission(): Boolean {
        val permission = if (Build.VERSION.SDK_INT >= 33) Manifest.permission.READ_MEDIA_AUDIO else Manifest.permission.READ_EXTERNAL_STORAGE
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
    }

    private fun scanLocalMusic() {
        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.DURATION
        )
        val candidates = mutableListOf<Candidate>()

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
                val id = cursor.getLong(idCol)
                val uri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id)
                candidates += Candidate(
                    cursor.getString(titleCol).orEmpty(),
                    cursor.getString(artistCol).orEmpty(),
                    uri,
                    cursor.getLong(durationCol)
                )
            }
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
        buildQueue(true)
        showPage(page)
        toast("Matched ${matches.size} of 13 approved tracks.")
    }

    private fun normalize(value: String): String =
        value.lowercase(Locale.ROOT).filter { it.isLetterOrDigit() }

    private fun loadMappings() {
        FightModeCatalog.tracks.forEach { track ->
            val uri = prefs.getString("track_uri_${track.id}", null)
            if (uri != null) {
                matches[track.id] = LocalMatch(
                    Uri.parse(uri),
                    prefs.getLong("track_duration_${track.id}", 0L)
                )
            }
        }
    }

    private fun saveMappings() {
        val edit = prefs.edit()
        FightModeCatalog.tracks.forEach { track ->
            val match = matches[track.id]
            if (match == null) {
                edit.remove("track_uri_${track.id}")
                edit.remove("track_duration_${track.id}")
            } else {
                edit.putString("track_uri_${track.id}", match.uri.toString())
                edit.putLong("track_duration_${track.id}", match.durationMs)
            }
        }
        edit.apply()
    }

    private fun sourceMode(): SourceMode {
        val raw = prefs.getString("source_mode", SourceMode.NONE.name) ?: SourceMode.NONE.name
        return runCatching { SourceMode.valueOf(raw) }.getOrDefault(SourceMode.NONE)
    }

    private fun setSource(mode: SourceMode) {
        prefs.edit().putString("source_mode", mode.name).apply()
        if (mode != SourceMode.LOCAL) controller?.pause()
        showPage(page)
    }

    private fun openExternal(track: TrackSpec) {
        val query = Uri.encode("${track.artist} ${track.title}")
        when (sourceMode()) {
            SourceMode.SPOTIFY -> {
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("spotify:search:$query")))
                } catch (_: ActivityNotFoundException) {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://open.spotify.com/search/$query")))
                }
            }
            SourceMode.YOUTUBE_MUSIC -> {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://music.youtube.com/search?q=$query")))
            }
            else -> Unit
        }
    }

    private fun persistPlaybackState() {
        val c = controller ?: return
        val id = c.currentMediaItem?.mediaId
        prefs.edit()
            .putString("current_media_id", id)
            .putLong("current_position_ms", c.currentPosition.coerceAtLeast(0L))
            .apply()
    }

    private fun ownerGate() {
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
                    ownerSettings()
                } else if (hash == stored) {
                    ownerSettings()
                } else {
                    toast("Incorrect owner PIN.")
                }
            }
            .show()
    }

    private fun ownerSettings() {
        val actions = arrayOf(
            "Rescan approved local tracks",
            "Clear local track mappings",
            "Reset RUN session",
            "Disconnect music source",
            "Change owner PIN"
        )

        AlertDialog.Builder(this)
            .setTitle("OWNER SETTINGS")
            .setItems(actions) { _, which ->
                when (which) {
                    0 -> {
                        setSource(SourceMode.LOCAL)
                        requestLocalAccessAndScan()
                    }
                    1 -> {
                        matches.clear()
                        saveMappings()
                        controller?.clearMediaItems()
                        showPage(page)
                    }
                    2 -> {
                        runStartMs = 0L
                        prefs.edit().remove("run_start_ms").apply()
                        updateDynamicUi()
                    }
                    3 -> {
                        prefs.edit().putString("source_mode", SourceMode.NONE.name).apply()
                        controller?.pause()
                        showPage(Page.PLAYER)
                    }
                    4 -> {
                        prefs.edit().remove("owner_pin_hash").apply()
                        toast("Owner PIN cleared. Open Owner Settings to create a new PIN.")
                    }
                }
            }
            .setNegativeButton("Close", null)
            .show()
    }

    private fun header(title: String, subtitle: String): View = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        addView(text(title, 29, Color.WHITE, Gravity.START, Typeface.BOLD))
        addView(text(subtitle, 13, accent(), Gravity.START, Typeface.BOLD), mt(2))
    }

    private fun text(
        value: String,
        size: Int,
        color: Int,
        gravityValue: Int = Gravity.START,
        style: Int = Typeface.NORMAL
    ) = TextView(this).apply {
        text = value
        textSize = size.toFloat()
        setTextColor(color)
        gravity = gravityValue
        typeface = Typeface.create(Typeface.DEFAULT, style)
        setLineSpacing(0f, 1.06f)
    }

    private fun button(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        textSize = 11f
        setTextColor(Color.WHITE)
        isAllCaps = false
        background = rounded(Color.rgb(29, 29, 29), 12)
        setOnClickListener { action() }
    }

    private fun primaryButton(label: String, action: () -> Unit) = button(label, action).apply {
        background = rounded(accent(), 12)
        textSize = 13f
        typeface = Typeface.DEFAULT_BOLD
    }

    private fun rounded(fill: Int, radiusDp: Int, stroke: Int? = null): GradientDrawable =
        GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(fill)
            cornerRadius = dp(radiusDp).toFloat()
            if (stroke != null) setStroke(dp(1), stroke)
        }

    private fun mt(value: Int) =
        LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            topMargin = dp(value)
        }

    private fun weighted() =
        LinearLayout.LayoutParams(0, dp(50), 1f).apply {
            setMargins(dp(4), 0, dp(4), 0)
        }

    private fun bg() = Color.rgb(8, 8, 8)
    private fun accent() = Color.rgb(235, 52, 56)
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    private fun formatTime(ms: Long): String {
        val seconds = ms.coerceAtLeast(0L) / 1000L
        return "%d:%02d".format(seconds / 60L, seconds % 60L)
    }

    private fun formatTrackLength(seconds: Int): String =
        "%d:%02d".format(seconds / 60, seconds % 60)

    private fun sha256(value: String): String =
        MessageDigest.getInstance("SHA-256")
            .digest(value.toByteArray())
            .joinToString("") { "%02x".format(it) }

    private fun toast(message: String) =
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}
