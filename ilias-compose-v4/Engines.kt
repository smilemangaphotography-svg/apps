package com.iliaperformance.iliacoach2026

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Base64
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest
import java.security.SecureRandom

class AnatomyEngine(private val context: Context) {
    fun exactAnimationUri(exercise: Exercise): Uri? {
        if (exercise.animationAsset.isBlank()) return null
        val exists = runCatching { context.assets.open(exercise.animationAsset).use { } }.isSuccess
        return if (exists) Uri.parse("asset:///${exercise.animationAsset}") else null
    }

    fun exactPosterAsset(exercise: Exercise): String? {
        val exists = runCatching { context.assets.open(exercise.posterAsset).use { } }.isSuccess
        return if (exists) exercise.posterAsset else null
    }
}

class Media3MusicEngine(context: Context) {
    val player: ExoPlayer = ExoPlayer.Builder(context.applicationContext).build()
    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying

    init {
        player.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                _isPlaying.value = isPlaying
            }
        })
    }

    fun play(uri: Uri) {
        player.setMediaItem(MediaItem.fromUri(uri))
        player.prepare()
        player.playWhenReady = true
    }

    fun toggle() {
        if (player.isPlaying) player.pause() else player.play()
    }

    fun pause() = player.pause()
    fun release() = player.release()
}

data class SpotifyState(
    val clientId: String = "",
    val accessToken: String = "",
    val refreshToken: String = "",
    val expiresAt: Long = 0L
) {
    val connected: Boolean get() = clientId.isNotBlank() && accessToken.isNotBlank()
}

class SpotifyManager(
    private val context: Context,
    private val prefs: OwnerPreferences
) {
    companion object {
        const val REDIRECT_URI = "iliascoach://spotify-callback"
        private const val AUTH = "https://accounts.spotify.com/authorize"
        private const val TOKEN = "https://accounts.spotify.com/api/token"
        private const val API = "https://api.spotify.com/v1"
        private const val SCOPES = "user-read-playback-state user-modify-playback-state user-read-currently-playing"
    }

    suspend fun state(): SpotifyState = SpotifyState(
        clientId = prefs.spotifyClientIdFlow.first(),
        accessToken = prefs.spotifyAccessFlow.first(),
        refreshToken = prefs.spotifyRefreshFlow.first(),
        expiresAt = prefs.spotifyExpiresFlow.first()
    )

    suspend fun beginLogin(): Boolean {
        val clientId = prefs.spotifyClientIdFlow.first()
        if (clientId.isBlank()) return false
        val verifier = randomVerifier()
        prefs.saveSpotifyVerifier(verifier)
        val challenge = challenge(verifier)
        val url = AUTH + "?response_type=code" +
            "&client_id=" + enc(clientId) +
            "&scope=" + enc(SCOPES) +
            "&redirect_uri=" + enc(REDIRECT_URI) +
            "&code_challenge_method=S256" +
            "&code_challenge=" + enc(challenge)
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        return true
    }

    suspend fun handleCallback(uri: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val code = uri.getQueryParameter("code") ?: error("Spotify returned no authorization code")
            val verifier = prefs.spotifyVerifierFlow.first()
            val clientId = prefs.spotifyClientIdFlow.first()
            require(verifier.isNotBlank() && clientId.isNotBlank())
            val form = mapOf(
                "grant_type" to "authorization_code",
                "code" to code,
                "redirect_uri" to REDIRECT_URI,
                "client_id" to clientId,
                "code_verifier" to verifier
            )
            val json = postForm(TOKEN, form)
            val access = json.getString("access_token")
            val refresh = json.optString("refresh_token")
            val expires = System.currentTimeMillis() + json.optLong("expires_in", 3600L) * 1000L - 30_000L
            prefs.saveSpotifyTokens(access, refresh, expires)
        }
    }

    suspend fun play(): Result<Unit> = apiCommand("PUT", "/me/player/play")
    suspend fun pause(): Result<Unit> = apiCommand("PUT", "/me/player/pause")
    suspend fun next(): Result<Unit> = apiCommand("POST", "/me/player/next")
    suspend fun previous(): Result<Unit> = apiCommand("POST", "/me/player/previous")

    suspend fun disconnect() = prefs.clearSpotify()

    private suspend fun apiCommand(method: String, path: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val access = validAccessToken()
            val c = (URL(API + path).openConnection() as HttpURLConnection).apply {
                requestMethod = method
                setRequestProperty("Authorization", "Bearer $access")
                connectTimeout = 10_000
                readTimeout = 10_000
                doOutput = method == "PUT" || method == "POST"
                if (doOutput) outputStream.use { }
            }
            val code = c.responseCode
            if (code !in 200..299 && code != 204) error("Spotify playback request failed: $code")
            c.disconnect()
        }
    }

    private suspend fun validAccessToken(): String {
        var s = state()
        if (s.accessToken.isNotBlank() && System.currentTimeMillis() < s.expiresAt) return s.accessToken
        if (s.refreshToken.isBlank() || s.clientId.isBlank()) error("Spotify session expired")
        val json = withContext(Dispatchers.IO) {
            postForm(TOKEN, mapOf(
                "grant_type" to "refresh_token",
                "refresh_token" to s.refreshToken,
                "client_id" to s.clientId
            ))
        }
        val access = json.getString("access_token")
        val refresh = json.optString("refresh_token", s.refreshToken)
        val expires = System.currentTimeMillis() + json.optLong("expires_in", 3600L) * 1000L - 30_000L
        prefs.saveSpotifyTokens(access, refresh, expires)
        s = SpotifyState(s.clientId, access, refresh, expires)
        return s.accessToken
    }

    private fun postForm(url: String, form: Map<String, String>): JSONObject {
        val body = form.entries.joinToString("&") { enc(it.key) + "=" + enc(it.value) }
        val c = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            connectTimeout = 10_000
            readTimeout = 10_000
            doOutput = true
            outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        }
        val code = c.responseCode
        val stream = if (code in 200..299) c.inputStream else c.errorStream
        val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        c.disconnect()
        if (code !in 200..299) error("Spotify token request failed: $code $text")
        return JSONObject(text)
    }

    private fun randomVerifier(): String {
        val bytes = ByteArray(48)
        SecureRandom().nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    }

    private fun challenge(verifier: String): String {
        val hash = MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(Charsets.US_ASCII))
        return Base64.encodeToString(hash, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    }

    private fun enc(value: String) = URLEncoder.encode(value, "UTF-8")
}
