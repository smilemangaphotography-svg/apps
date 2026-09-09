package com.ilia.workschedule

import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** Compatibility overload for combining horizontal and bottom padding in Compose. */
fun Modifier.padding(horizontal: Dp, bottom: Dp): Modifier =
    this.padding(start = horizontal, top = 0.dp, end = horizontal, bottom = bottom)
