package eu.infinitedrive.app

data class TrackSpec(
    val id: String,
    val title: String,
    val artist: String,
    val phase: String,
    val durationSeconds: Int
)

object FightModeCatalog {
    val tracks = listOf(
        TrackSpec("01", "Till I Collapse", "Eminem", "IGNITION", 297),
        TrackSpec("02", "Welcome to the Circus", "Five Finger Death Punch", "IGNITION", 256),
        TrackSpec("03", "Faint", "Linkin Park", "BUILD", 162),
        TrackSpec("04", "Last Resort", "Papa Roach", "BUILD", 199),
        TrackSpec("05", "Indestructible", "Disturbed", "BUILD", 278),
        TrackSpec("06", "Survival", "Eminem", "ATTACK", 272),
        TrackSpec("07", "Jekyll and Hyde", "Five Finger Death Punch", "ATTACK", 206),
        TrackSpec("08", "Throne", "Bring Me The Horizon", "ATTACK", 191),
        TrackSpec("09", "Omen", "The Prodigy", "ATTACK", 216),
        TrackSpec("10", "Blah Blah Blah", "Armin van Buuren", "REDLINE", 183),
        TrackSpec("11", "Lose Yourself", "Eminem", "REDLINE", 326),
        TrackSpec("12", "Eye of the Tiger", "Survivor", "REDLINE", 246),
        TrackSpec("13", "Going the Distance", "Bill Conti", "FINISH", 160)
    )

    val totalDurationSeconds: Int = tracks.sumOf { it.durationSeconds }

    fun byId(id: String?): TrackSpec? = tracks.firstOrNull { it.id == id }
}
