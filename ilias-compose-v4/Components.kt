package com.iliaperformance.iliacoach2026

import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Menu
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Image
import androidx.compose.material3.Card
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.delay

val CoachBg = Color(0xFF06131C)
val CoachBgDeep = Color(0xFF03090E)
val CoachCard = Color(0xFF0A1C27)
val CoachCard2 = Color(0xFF0E2633)
val CoachLine = Color(0xFF183746)
val CoachBlue = Color(0xFF33B6FF)
val CoachBlue2 = Color(0xFF168EF0)
val CoachLime = Color(0xFFB7FF2A)
val CoachText = Color(0xFFF3F7FA)
val CoachMuted = Color(0xFF91A5B3)
val CoachCream = Color(0xFFF4EADC)

private val CoachColors = darkColorScheme(
    primary = CoachBlue,
    secondary = CoachLime,
    background = CoachBg,
    surface = CoachCard,
    onPrimary = Color.White,
    onSecondary = CoachBgDeep,
    onBackground = CoachText,
    onSurface = CoachText
)

@Composable
fun CoachTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = CoachColors, typography = MaterialTheme.typography, content = content)
}

@Composable
fun SafeAreaContainer(content: @Composable () -> Unit) {
    Box(
        Modifier
            .fillMaxSize()
            .background(CoachBgDeep)
            .windowInsetsPadding(WindowInsets.safeDrawing)
    ) { content() }
}

@Composable
fun IliaTopBar(
    title: String,
    eyebrow: String,
    canGoBack: Boolean,
    onBack: () -> Unit,
    onMenu: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(CoachBgDeep)
            .padding(horizontal = 18.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        RoundIconButton(
            icon = { Icon(Icons.AutoMirrored.Rounded.ArrowBack, null, tint = CoachText) },
            enabled = canGoBack,
            onClick = onBack
        )
        Column(Modifier.weight(1f)) {
            Text(eyebrow.uppercase(), color = CoachBlue, fontSize = 11.sp, letterSpacing = 2.sp, fontWeight = FontWeight.Bold)
            Text(title, color = CoachText, fontSize = 28.sp, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        RoundIconButton(icon = { Icon(Icons.Rounded.Menu, null, tint = CoachText) }, onClick = onMenu)
    }
}

@Composable
fun RoundIconButton(
    icon: @Composable () -> Unit,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    Box(
        Modifier
            .size(54.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(if (enabled) CoachCard else CoachCard.copy(alpha = .45f))
            .border(1.dp, CoachLine, RoundedCornerShape(18.dp))
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center
    ) { icon() }
}

@Composable
fun IliaBottomBar(
    pages: List<OwnerPageConfig>,
    currentId: String,
    onSelect: (String) -> Unit
) {
    NavigationBar(
        containerColor = CoachBgDeep,
        tonalElevation = 0.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        pages.take(5).forEach { page ->
            NavigationBarItem(
                selected = currentId == page.id,
                onClick = { onSelect(page.id) },
                icon = { Text(navGlyph(page.id), fontSize = 19.sp, color = if (currentId == page.id) CoachBlue else CoachMuted) },
                label = { Text(shortTitle(page.title), fontSize = 11.sp) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = CoachBlue,
                    selectedTextColor = CoachBlue,
                    unselectedIconColor = CoachMuted,
                    unselectedTextColor = CoachMuted,
                    indicatorColor = CoachCard2
                )
            )
        }
    }
}

private fun navGlyph(id: String) = when (id) {
    "today" -> "▣"
    "programs" -> "▥"
    "recovery" -> "◔"
    "nutrition" -> "◉"
    "progress" -> "▤"
    "music" -> "♫"
    else -> "◆"
}

private fun shortTitle(title: String) = title
    .replace("Recovery / Physio", "Recovery")
    .replace("Spotify / Music", "Music")
    .take(10)

@Composable
fun PremiumCard(
    modifier: Modifier = Modifier,
    size: BlockSize = BlockSize.Standard,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val min = when (size) {
        BlockSize.Compact -> 74.dp
        BlockSize.Standard -> 104.dp
        BlockSize.Expanded -> 170.dp
    }
    Card(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = min)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = CoachCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, CoachLine)
    ) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp), content = content)
    }
}

@Composable
fun MetricTile(value: String, label: String, accent: Color = CoachBlue, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(CoachCard)
            .border(1.dp, CoachLine, RoundedCornerShape(20.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        Text(value, color = CoachText, fontSize = 24.sp, fontWeight = FontWeight.Black)
        Text(label.uppercase(), color = accent, fontSize = 10.sp, letterSpacing = 1.3.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun OwnerEditableBlock(
    config: OwnerBlockConfig,
    editorMode: Boolean = false,
    onMoveUp: () -> Unit = {},
    onMoveDown: () -> Unit = {},
    onHide: () -> Unit = {},
    onResize: () -> Unit = {},
    content: @Composable () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (editorMode) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(config.title, color = CoachBlue, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                MiniAction("↑", onMoveUp)
                MiniAction("↓", onMoveDown)
                MiniAction(config.size.name.take(1), onResize)
                MiniAction("Hide", onHide)
            }
        }
        content()
    }
}

@Composable
fun MiniAction(text: String, onClick: () -> Unit, accent: Color = CoachBlue) {
    Box(
        Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(CoachCard2)
            .border(1.dp, CoachLine, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp)
    ) { Text(text, color = accent, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
}

@Composable
fun FullScreenPage(content: @Composable () -> Unit) {
    Box(Modifier.fillMaxSize().background(CoachBg)) { content() }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun SwipePager(
    pages: List<OwnerPageConfig>,
    currentId: String,
    onPageChanged: (String) -> Unit,
    renderPage: @Composable (OwnerPageConfig) -> Unit
): PagerState {
    val safePages = pages.ifEmpty { listOf(OwnerPageConfig("today", "Today", order = 0)) }
    val initial = safePages.indexOfFirst { it.id == currentId }.coerceAtLeast(0)
    val pagerState = rememberPagerState(initialPage = initial, pageCount = { safePages.size })

    LaunchedEffect(currentId, safePages.map { it.id }) {
        val index = safePages.indexOfFirst { it.id == currentId }
        if (index >= 0 && index != pagerState.currentPage) pagerState.animateScrollToPage(index)
    }
    LaunchedEffect(pagerState.currentPage, safePages.map { it.id }) {
        safePages.getOrNull(pagerState.currentPage)?.let { onPageChanged(it.id) }
    }

    HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { index ->
        renderPage(safePages[index])
    }
    return pagerState
}

@Composable
fun AssetImage(asset: String, modifier: Modifier = Modifier, contentScale: ContentScale = ContentScale.Crop) {
    val context = LocalContext.current
    val bitmap = remember(asset) {
        runCatching { context.assets.open(asset).use(BitmapFactory::decodeStream) }.getOrNull()
    }
    if (bitmap != null) {
        Image(bitmap.asImageBitmap(), null, modifier = modifier, contentScale = contentScale)
    } else {
        Box(modifier.background(CoachCard2), contentAlignment = Alignment.Center) {
            Text("Asset unavailable", color = CoachMuted)
        }
    }
}

@Composable
fun AnatomyVideo(
    uri: Uri,
    loop: Boolean,
    modifier: Modifier = Modifier,
    onPlayerReady: (ExoPlayer) -> Unit = {}
) {
    val context = LocalContext.current
    val player = remember(uri) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(uri))
            repeatMode = if (loop) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
            volume = 0f
            prepare()
            playWhenReady = true
        }
    }
    DisposableEffect(player) {
        onPlayerReady(player)
        onDispose { player.release() }
    }
    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            PlayerView(ctx).apply {
                useController = false
                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                this.player = player
                setShutterBackgroundColor(android.graphics.Color.rgb(244, 234, 220))
            }
        },
        update = { it.player = player }
    )
}

@Composable
fun RestTimerChip(restEndsAt: Long) {
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(restEndsAt) {
        while (restEndsAt > System.currentTimeMillis()) {
            now = System.currentTimeMillis()
            delay(250)
        }
        now = System.currentTimeMillis()
    }
    val seconds = ((restEndsAt - now).coerceAtLeast(0L) + 999L) / 1000L
    Box(
        Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(if (seconds > 0) CoachLime else CoachCard2)
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Text(if (seconds > 0) "REST ${seconds}s" else "READY", color = if (seconds > 0) CoachBgDeep else CoachMuted, fontWeight = FontWeight.Black)
    }
}
