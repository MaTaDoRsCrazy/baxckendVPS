package com.emessenger.app.core.design

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val LightColors = lightColorScheme(
    primary = Color(0xFF1E5EFF),
    onPrimary = Color.White,
    secondary = Color(0xFF24C3E8),
    tertiary = Color(0xFF7268FF),
    background = Color(0xFFF4F7FB),
    surface = Color(0xFFFFFFFF),
    surfaceVariant = Color(0xFFE8EEF8),
    onSurface = Color(0xFF0F172A),
    onSurfaceVariant = Color(0xFF5B6475),
    error = Color(0xFFD84E6A)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF71A8FF),
    onPrimary = Color(0xFF07152B),
    secondary = Color(0xFF59D9FF),
    tertiary = Color(0xFFA89BFF),
    background = Color(0xFF08111F),
    surface = Color(0xFF0F1B33),
    surfaceVariant = Color(0xFF142540),
    onSurface = Color(0xFFF4F7FB),
    onSurfaceVariant = Color(0xFF9BA8C7),
    error = Color(0xFFFF8CA2)
)

private val PulseLineTypography = Typography(
    headlineLarge = TextStyle(fontSize = 34.sp, lineHeight = 40.sp, fontWeight = FontWeight.Bold),
    headlineMedium = TextStyle(fontSize = 28.sp, lineHeight = 34.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 22.sp, lineHeight = 28.sp, fontWeight = FontWeight.SemiBold),
    titleMedium = TextStyle(fontSize = 18.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.Normal),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 22.sp, fontWeight = FontWeight.Normal),
    bodySmall = TextStyle(fontSize = 12.sp, lineHeight = 18.sp, fontWeight = FontWeight.Medium),
    labelLarge = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.SemiBold)
)

private val PulseLineShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(16.dp),
    medium = RoundedCornerShape(22.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = RoundedCornerShape(36.dp)
)

data class PulseLineSpacing(
    val xs: Int = 6,
    val sm: Int = 10,
    val md: Int = 16,
    val lg: Int = 24,
    val xl: Int = 32
)

val LocalPulseLineSpacing = staticCompositionLocalOf { PulseLineSpacing() }

@Composable
fun PulseLineTheme(
    darkTheme: Boolean,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = PulseLineTypography,
        shapes = PulseLineShapes,
        content = content
    )
}
