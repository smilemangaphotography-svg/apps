package com.iliaperformance.iliacoach2026

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

class CoachViewModel(app: Application) : AndroidViewModel(app) {
    private val prefs = OwnerPreferences(app)
    private val dao = CoachDatabase.get(app).workoutDao()

    val anatomyEngine = AnatomyEngine(app)
    val musicEngine = Media3MusicEngine(app)
    val spotify = SpotifyManager(app, prefs)

    val layout: StateFlow<OwnerLayoutConfig> = prefs.layoutFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), CoachDefaults.layout
    )
    val features: StateFlow<FeatureToggles> = prefs.featuresFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), FeatureToggles()
    )
    val focus: StateFlow<FocusProfile> = prefs.focusFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), FocusProfile()
    )
    val workoutState: StateFlow<WorkoutStateEntity?> = dao.observeState().stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), null
    )
    val workoutLogs: StateFlow<List<WorkoutLogEntity>> = dao.observeLogs().stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList()
    )
    val localMusicUri: StateFlow<String> = prefs.localMusicUriFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), ""
    )
    val spotifyState: StateFlow<SpotifyState> = combine(
        prefs.spotifyClientIdFlow,
        prefs.spotifyAccessFlow,
        prefs.spotifyRefreshFlow,
        prefs.spotifyExpiresFlow
    ) { client, access, refresh, expires -> SpotifyState(client, access, refresh, expires) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SpotifyState())

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message
    fun clearMessage() { _message.value = null }

    fun setPageVisible(id: String, value: Boolean) = mutateLayout { cfg ->
        cfg.copy(pages = cfg.pages.map { if (it.id == id) it.copy(visible = value) else it })
    }

    fun renamePage(id: String, title: String) = mutateLayout { cfg ->
        cfg.copy(pages = cfg.pages.map { if (it.id == id && title.isNotBlank()) it.copy(title = title.trim()) else it })
    }

    fun setPageBottom(id: String, value: Boolean) = mutateLayout { cfg ->
        cfg.copy(pages = cfg.pages.map { if (it.id == id) it.copy(showBottom = value) else it })
    }

    fun setPageDrawer(id: String, value: Boolean) = mutateLayout { cfg ->
        cfg.copy(pages = cfg.pages.map { if (it.id == id) it.copy(showDrawer = value) else it })
    }

    fun movePage(id: String, delta: Int) = mutateLayout { cfg ->
        val sorted = cfg.pages.sortedBy { it.order }.toMutableList()
        val i = sorted.indexOfFirst { it.id == id }
        val j = i + delta
        if (i < 0 || j !in sorted.indices) cfg else {
            val a = sorted[i]; val b = sorted[j]
            sorted[i] = a.copy(order = b.order)
            sorted[j] = b.copy(order = a.order)
            cfg.copy(pages = sorted)
        }
    }

    fun addCustomPage(title: String) = mutateLayout { cfg ->
        if (title.isBlank()) cfg else {
            val id = "custom-${System.currentTimeMillis()}"
            val next = (cfg.pages.maxOfOrNull { it.order } ?: 0) + 1
            cfg.copy(
                pages = cfg.pages + OwnerPageConfig(id, title.trim(), order = next, custom = true),
                blocks = cfg.blocks + OwnerBlockConfig("$id.block", id, "Custom block", order = 0, kind = "customText")
            )
        }
    }

    fun removeCustomPage(id: String) = mutateLayout { cfg ->
        val page = cfg.pages.firstOrNull { it.id == id }
        if (page?.custom != true) cfg else cfg.copy(
            pages = cfg.pages.filterNot { it.id == id },
            blocks = cfg.blocks.filterNot { it.pageId == id }
        )
    }

    fun setBlockVisible(id: String, value: Boolean) = mutateLayout { cfg ->
        cfg.copy(blocks = cfg.blocks.map { if (it.id == id) it.copy(visible = value) else it })
    }

    fun moveBlock(id: String, delta: Int) = mutateLayout { cfg ->
        val target = cfg.blocks.firstOrNull { it.id == id } ?: return@mutateLayout cfg
        val group = cfg.blocks.filter { it.pageId == target.pageId }.sortedBy { it.order }.toMutableList()
        val i = group.indexOfFirst { it.id == id }
        val j = i + delta
        if (i < 0 || j !in group.indices) cfg else {
            val a = group[i]; val b = group[j]
            val replacements = mapOf(a.id to a.copy(order = b.order), b.id to b.copy(order = a.order))
            cfg.copy(blocks = cfg.blocks.map { replacements[it.id] ?: it })
        }
    }

    fun resizeBlock(id: String) = mutateLayout { cfg ->
        cfg.copy(blocks = cfg.blocks.map { b ->
            if (b.id != id) b else b.copy(size = when (b.size) {
                BlockSize.Compact -> BlockSize.Standard
                BlockSize.Standard -> BlockSize.Expanded
                BlockSize.Expanded -> BlockSize.Compact
            })
        })
    }

    fun replaceBlock(id: String, kind: String) = mutateLayout { cfg ->
        cfg.copy(blocks = cfg.blocks.map { if (it.id == id) it.copy(kind = kind) else it })
    }

    fun resetOwnerLayout() = viewModelScope.launch { prefs.resetOwnerLayout() }

    private fun mutateLayout(transform: (OwnerLayoutConfig) -> OwnerLayoutConfig) {
        viewModelScope.launch { prefs.saveLayout(transform(layout.value)) }
    }

    fun setFeature(transform: (FeatureToggles) -> FeatureToggles) {
        viewModelScope.launch { prefs.saveFeatures(transform(features.value)) }
    }

    fun setFocus(key: String, value: Int) {
        val v = value.coerceIn(0, 100)
        val f = focus.value
        val next = when (key) {
            "upper" -> f.copy(upper = v, lower = 100 - v)
            "lower" -> f.copy(lower = v, upper = 100 - v)
            "recovery" -> f.copy(recovery = v)
            "mobility" -> f.copy(mobility = v)
            "cardio" -> f.copy(cardio = v)
            "core" -> f.copy(core = v)
            "strength" -> f.copy(strength = v)
            else -> f
        }
        viewModelScope.launch { prefs.saveFocus(next) }
    }

    fun setSpotifyClientId(value: String) = viewModelScope.launch { prefs.saveSpotifyClientId(value) }

    fun connectSpotify() = viewModelScope.launch {
        if (!spotify.beginLogin()) _message.value = "Add your Spotify Client ID in Owner Layout first."
    }

    fun handleSpotifyCallback(uri: Uri) = viewModelScope.launch {
        spotify.handleCallback(uri)
            .onSuccess { _message.value = "Spotify connected." }
            .onFailure { _message.value = it.message ?: "Spotify connection failed." }
    }

    fun spotifyPlay() = viewModelScope.launch { spotify.play().onFailure { _message.value = it.message } }
    fun spotifyPause() = viewModelScope.launch { spotify.pause().onFailure { _message.value = it.message } }
    fun spotifyNext() = viewModelScope.launch { spotify.next().onFailure { _message.value = it.message } }
    fun spotifyPrevious() = viewModelScope.launch { spotify.previous().onFailure { _message.value = it.message } }
    fun disconnectSpotify() = viewModelScope.launch { spotify.disconnect() }

    fun setLocalMusicUri(uri: String) = viewModelScope.launch { prefs.saveLocalMusicUri(uri) }
    fun playLocalMusic(uri: Uri) { musicEngine.play(uri) }

    fun startWorkout(exerciseId: String) {
        ExerciseCatalog.require(exerciseId)
        val sessionId = workoutState.value?.sessionId?.takeIf { workoutState.value?.sessionActive == true }
            ?: UUID.randomUUID().toString()
        viewModelScope.launch {
            dao.saveState(
                WorkoutStateEntity(
                    sessionId = sessionId,
                    currentExerciseId = exerciseId,
                    currentSet = 0,
                    completedSets = workoutState.value?.completedSets ?: 0,
                    sessionActive = true
                )
            )
        }
        if (features.value.autoMusic && localMusicUri.value.isNotBlank()) {
            runCatching { musicEngine.play(Uri.parse(localMusicUri.value)) }
        }
    }

    fun setCurrentExercise(exerciseId: String) {
        val e = ExerciseCatalog.require(exerciseId)
        val old = workoutState.value ?: WorkoutStateEntity(sessionId = UUID.randomUUID().toString(), sessionActive = true)
        viewModelScope.launch { dao.saveState(old.copy(currentExerciseId = e.exerciseId, currentSet = 0, updatedAt = System.currentTimeMillis())) }
    }

    fun logSet(exercise: Exercise) {
        if (!features.value.logging) return
        val old = workoutState.value ?: WorkoutStateEntity(
            sessionId = UUID.randomUUID().toString(), currentExerciseId = exercise.exerciseId, sessionActive = true
        )
        val nextSet = old.currentSet + 1
        val now = System.currentTimeMillis()
        viewModelScope.launch {
            dao.insertLog(WorkoutLogEntity(
                sessionId = old.sessionId.ifBlank { UUID.randomUUID().toString() },
                exerciseId = exercise.exerciseId,
                setNumber = nextSet,
                completedAt = now
            ))
            dao.saveState(old.copy(
                currentExerciseId = exercise.exerciseId,
                currentSet = nextSet,
                completedSets = old.completedSets + 1,
                restEndsAt = if (features.value.timers) now + exercise.restSeconds * 1000L else 0L,
                sessionActive = true,
                updatedAt = now
            ))
        }
    }

    fun finishWorkout() = viewModelScope.launch {
        val old = workoutState.value ?: return@launch
        dao.saveState(old.copy(sessionActive = false, restEndsAt = 0L, updatedAt = System.currentTimeMillis()))
        musicEngine.pause()
    }

    override fun onCleared() {
        musicEngine.release()
        super.onCleared()
    }
}
