package com.iliaperformance.iliacoach2026

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.weight
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch

@Composable
fun CoachApp(
    deepLink: Uri?,
    onDeepLinkConsumed: () -> Unit,
    vm: CoachViewModel = viewModel()
) {
    CoachTheme {
        val context = LocalContext.current
        val layout by vm.layout.collectAsState()
        val message by vm.message.collectAsState()
        var currentId by rememberSaveable { mutableStateOf("today") }
        var selectedExerciseId by rememberSaveable { mutableStateOf<String?>(null) }
        val drawerState = rememberDrawerState(DrawerValue.Closed)
        val scope = rememberCoroutineScope()

        val visiblePages = layout.pages.filter { it.visible }.sortedBy { it.order }
        val currentPage = visiblePages.firstOrNull { it.id == currentId }
            ?: visiblePages.firstOrNull { it.id == "today" }
            ?: visiblePages.firstOrNull()

        LaunchedEffect(currentPage?.id) {
            if (currentPage != null && currentPage.id != currentId) currentId = currentPage.id
        }

        LaunchedEffect(deepLink) {
            if (deepLink?.scheme == "iliascoach") {
                vm.handleSpotifyCallback(deepLink)
                onDeepLinkConsumed()
            }
        }

        LaunchedEffect(message) {
            val text = message ?: return@LaunchedEffect
            Toast.makeText(context, text, Toast.LENGTH_LONG).show()
            vm.clearMessage()
        }

        val localPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            if (uri != null) {
                runCatching {
                    context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                vm.setLocalMusicUri(uri.toString())
                vm.playLocalMusic(uri)
            }
        }

        fun goBack() {
            when {
                selectedExerciseId != null -> selectedExerciseId = null
                drawerState.isOpen -> scope.launch { drawerState.close() }
                currentId != "today" -> currentId = "today"
                else -> (context as? Activity)?.finish()
            }
        }

        BackHandler { goBack() }

        SafeAreaContainer {
            if (selectedExerciseId != null) {
                val exercise = ExerciseCatalog.find(selectedExerciseId!!)
                if (exercise == null) {
                    FullScreenPage {
                        Box(Modifier.fillMaxSize().background(CoachBg), contentAlignment = androidx.compose.ui.Alignment.Center) {
                            Text("No exact exercise mapping found.", color = CoachText)
                        }
                    }
                } else {
                    ExercisePlayerScreen(
                        exercise = exercise,
                        vm = vm,
                        onBack = { selectedExerciseId = null },
                        onOpenOwner = {
                            selectedExerciseId = null
                            currentId = "owner"
                        }
                    )
                }
            } else {
                ModalNavigationDrawer(
                    drawerState = drawerState,
                    gesturesEnabled = true,
                    drawerContent = {
                        ModalDrawerSheet(drawerContainerColor = CoachBgDeep) {
                            SideDrawer(
                                pages = visiblePages.filter { it.showDrawer },
                                currentId = currentId,
                                onSelect = { id ->
                                    currentId = id
                                    scope.launch { drawerState.close() }
                                }
                            )
                        }
                    }
                ) {
                    Column(Modifier.fillMaxSize().background(CoachBg)) {
                        IliaTopBar(
                            title = currentPage?.title ?: "ILIAS COACH",
                            eyebrow = when (currentId) {
                                "today" -> "TRAIN · PHYSIO · NUTRITION · RECOVERY"
                                "today-plan" -> "CURRENT WORKOUT"
                                "next" -> "UPCOMING TRAINING"
                                "programs" -> "STRUCTURED TRAINING"
                                "recovery" -> "CAPACITY · MOBILITY · CONTROL"
                                "nutrition" -> "FUEL · RECOVER · PERFORM"
                                "progress" -> "MEASURE · ADAPT · IMPROVE"
                                "music" -> "MUSIC · DRIVE · FOCUS"
                                "owner" -> "FULL APP EDITOR"
                                "settings" -> "APP PREFERENCES"
                                else -> "ILIAS COACH"
                            },
                            canGoBack = currentId != "today",
                            onBack = { goBack() },
                            onMenu = { scope.launch { drawerState.open() } }
                        )

                        Box(Modifier.weight(1f)) {
                            SwipePager(
                                pages = visiblePages,
                                currentId = currentId,
                                onPageChanged = { currentId = it },
                                renderPage = { page ->
                                    CoachPageScreen(
                                        page = page,
                                        vm = vm,
                                        onExercise = { id ->
                                            vm.setCurrentExercise(id)
                                            selectedExerciseId = id
                                        },
                                        onNavigate = { currentId = it },
                                        onPickLocalMusic = { localPicker.launch(arrayOf("audio/*")) }
                                    )
                                }
                            )
                        }

                        IliaBottomBar(
                            pages = visiblePages.filter { it.showBottom },
                            currentId = currentId,
                            onSelect = { currentId = it }
                        )
                    }
                }
            }
        }
    }
}
