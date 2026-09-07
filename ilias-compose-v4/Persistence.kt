package com.iliaperformance.iliacoach2026

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.json.JSONArray
import org.json.JSONObject

@Entity(tableName = "workout_state")
data class WorkoutStateEntity(
    @PrimaryKey val id: Int = 1,
    val sessionId: String = "",
    val currentExerciseId: String? = null,
    val currentSet: Int = 0,
    val completedSets: Int = 0,
    val restEndsAt: Long = 0L,
    val sessionActive: Boolean = false,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "workout_log")
data class WorkoutLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sessionId: String,
    val exerciseId: String,
    val setNumber: Int,
    val completedAt: Long
)

@Dao
interface WorkoutDao {
    @Query("SELECT * FROM workout_state WHERE id = 1")
    fun observeState(): Flow<WorkoutStateEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveState(state: WorkoutStateEntity)

    @Insert
    suspend fun insertLog(log: WorkoutLogEntity)

    @Query("SELECT * FROM workout_log ORDER BY completedAt DESC")
    fun observeLogs(): Flow<List<WorkoutLogEntity>>

    @Query("DELETE FROM workout_state")
    suspend fun clearState()
}

@Database(entities = [WorkoutStateEntity::class, WorkoutLogEntity::class], version = 1, exportSchema = false)
abstract class CoachDatabase : RoomDatabase() {
    abstract fun workoutDao(): WorkoutDao

    companion object {
        @Volatile private var instance: CoachDatabase? = null
        fun get(context: Context): CoachDatabase = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(
                context.applicationContext,
                CoachDatabase::class.java,
                "ilias_coach.db"
            ).fallbackToDestructiveMigration().build().also { instance = it }
        }
    }
}

private val Context.ownerDataStore by preferencesDataStore("owner_layout")

class OwnerPreferences(private val context: Context) {
    private object Keys {
        val layout = stringPreferencesKey("layout_json")
        val features = stringPreferencesKey("features_json")
        val focus = stringPreferencesKey("focus_json")
        val spotifyClientId = stringPreferencesKey("spotify_client_id")
        val spotifyAccess = stringPreferencesKey("spotify_access")
        val spotifyRefresh = stringPreferencesKey("spotify_refresh")
        val spotifyVerifier = stringPreferencesKey("spotify_verifier")
        val spotifyExpires = longPreferencesKey("spotify_expires")
        val localMusicUri = stringPreferencesKey("local_music_uri")
    }

    val layoutFlow: Flow<OwnerLayoutConfig> = context.ownerDataStore.data.map { prefs ->
        decodeLayout(prefs[Keys.layout]) ?: CoachDefaults.layout
    }

    val featuresFlow: Flow<FeatureToggles> = context.ownerDataStore.data.map { prefs ->
        decodeFeatures(prefs[Keys.features]) ?: FeatureToggles()
    }

    val focusFlow: Flow<FocusProfile> = context.ownerDataStore.data.map { prefs ->
        decodeFocus(prefs[Keys.focus]) ?: FocusProfile()
    }

    val spotifyClientIdFlow: Flow<String> = context.ownerDataStore.data.map { it[Keys.spotifyClientId].orEmpty() }
    val spotifyAccessFlow: Flow<String> = context.ownerDataStore.data.map { it[Keys.spotifyAccess].orEmpty() }
    val spotifyRefreshFlow: Flow<String> = context.ownerDataStore.data.map { it[Keys.spotifyRefresh].orEmpty() }
    val spotifyExpiresFlow: Flow<Long> = context.ownerDataStore.data.map { it[Keys.spotifyExpires] ?: 0L }
    val spotifyVerifierFlow: Flow<String> = context.ownerDataStore.data.map { it[Keys.spotifyVerifier].orEmpty() }
    val localMusicUriFlow: Flow<String> = context.ownerDataStore.data.map { it[Keys.localMusicUri].orEmpty() }

    suspend fun saveLayout(layout: OwnerLayoutConfig) {
        context.ownerDataStore.edit { it[Keys.layout] = encodeLayout(layout) }
    }

    suspend fun saveFeatures(features: FeatureToggles) {
        context.ownerDataStore.edit { it[Keys.features] = encodeFeatures(features) }
    }

    suspend fun saveFocus(focus: FocusProfile) {
        context.ownerDataStore.edit { it[Keys.focus] = encodeFocus(focus) }
    }

    suspend fun saveSpotifyClientId(value: String) {
        context.ownerDataStore.edit { it[Keys.spotifyClientId] = value.trim() }
    }

    suspend fun saveSpotifyVerifier(value: String) {
        context.ownerDataStore.edit { it[Keys.spotifyVerifier] = value }
    }

    suspend fun saveSpotifyTokens(access: String, refresh: String, expiresAt: Long) {
        context.ownerDataStore.edit {
            it[Keys.spotifyAccess] = access
            if (refresh.isNotBlank()) it[Keys.spotifyRefresh] = refresh
            it[Keys.spotifyExpires] = expiresAt
        }
    }

    suspend fun clearSpotify() {
        context.ownerDataStore.edit {
            it.remove(Keys.spotifyAccess)
            it.remove(Keys.spotifyRefresh)
            it.remove(Keys.spotifyExpires)
            it.remove(Keys.spotifyVerifier)
        }
    }

    suspend fun saveLocalMusicUri(uri: String) {
        context.ownerDataStore.edit { it[Keys.localMusicUri] = uri }
    }

    suspend fun resetOwnerLayout() {
        context.ownerDataStore.edit {
            it.remove(Keys.layout)
            it.remove(Keys.features)
            it.remove(Keys.focus)
        }
    }

    private fun encodeLayout(layout: OwnerLayoutConfig): String {
        val root = JSONObject()
        val pages = JSONArray()
        layout.pages.forEach { p ->
            pages.put(JSONObject().apply {
                put("id", p.id); put("title", p.title); put("visible", p.visible); put("order", p.order)
                put("bottom", p.showBottom); put("drawer", p.showDrawer); put("custom", p.custom)
            })
        }
        val blocks = JSONArray()
        layout.blocks.forEach { b ->
            blocks.put(JSONObject().apply {
                put("id", b.id); put("pageId", b.pageId); put("title", b.title); put("visible", b.visible)
                put("order", b.order); put("size", b.size.name); put("kind", b.kind)
            })
        }
        root.put("pages", pages); root.put("blocks", blocks)
        return root.toString()
    }

    private fun decodeLayout(raw: String?): OwnerLayoutConfig? = runCatching {
        if (raw.isNullOrBlank()) return@runCatching null
        val root = JSONObject(raw)
        val pagesArray = root.getJSONArray("pages")
        val pages = buildList {
            for (i in 0 until pagesArray.length()) {
                val p = pagesArray.getJSONObject(i)
                add(OwnerPageConfig(
                    id = p.getString("id"), title = p.getString("title"), visible = p.optBoolean("visible", true),
                    order = p.optInt("order", i), showBottom = p.optBoolean("bottom", false),
                    showDrawer = p.optBoolean("drawer", true), custom = p.optBoolean("custom", false)
                ))
            }
        }
        val blocksArray = root.getJSONArray("blocks")
        val blocks = buildList {
            for (i in 0 until blocksArray.length()) {
                val b = blocksArray.getJSONObject(i)
                add(OwnerBlockConfig(
                    id = b.getString("id"), pageId = b.getString("pageId"), title = b.getString("title"),
                    visible = b.optBoolean("visible", true), order = b.optInt("order", i),
                    size = runCatching { BlockSize.valueOf(b.optString("size", "Standard")) }.getOrDefault(BlockSize.Standard),
                    kind = b.optString("kind", b.getString("id"))
                ))
            }
        }
        OwnerLayoutConfig(pages, blocks)
    }.getOrNull()

    private fun encodeFeatures(f: FeatureToggles) = JSONObject().apply {
        put("anatomyMotion", f.anatomyMotion); put("formLock", f.formLock); put("autoLoop", f.autoLoop)
        put("voiceCue", f.voiceCue); put("coachingText", f.coachingText); put("muscleHighlight", f.muscleHighlight)
        put("timers", f.timers); put("logging", f.logging); put("painSafe", f.painSafe)
        put("recoveryMode", f.recoveryMode); put("autoMusic", f.autoMusic)
    }.toString()

    private fun decodeFeatures(raw: String?): FeatureToggles? = runCatching {
        if (raw.isNullOrBlank()) return@runCatching null
        val o = JSONObject(raw)
        FeatureToggles(
            anatomyMotion = o.optBoolean("anatomyMotion", true), formLock = o.optBoolean("formLock", true),
            autoLoop = o.optBoolean("autoLoop", true), voiceCue = o.optBoolean("voiceCue", false),
            coachingText = o.optBoolean("coachingText", true), muscleHighlight = o.optBoolean("muscleHighlight", true),
            timers = o.optBoolean("timers", true), logging = o.optBoolean("logging", true),
            painSafe = o.optBoolean("painSafe", true), recoveryMode = o.optBoolean("recoveryMode", true),
            autoMusic = o.optBoolean("autoMusic", false)
        )
    }.getOrNull()

    private fun encodeFocus(f: FocusProfile) = JSONObject().apply {
        put("upper", f.upper); put("lower", f.lower); put("recovery", f.recovery); put("mobility", f.mobility)
        put("cardio", f.cardio); put("core", f.core); put("strength", f.strength)
    }.toString()

    private fun decodeFocus(raw: String?): FocusProfile? = runCatching {
        if (raw.isNullOrBlank()) return@runCatching null
        val o = JSONObject(raw)
        FocusProfile(
            upper = o.optInt("upper", 45), lower = o.optInt("lower", 55), recovery = o.optInt("recovery", 60),
            mobility = o.optInt("mobility", 45), cardio = o.optInt("cardio", 30), core = o.optInt("core", 40),
            strength = o.optInt("strength", 65)
        )
    }.getOrNull()
}
