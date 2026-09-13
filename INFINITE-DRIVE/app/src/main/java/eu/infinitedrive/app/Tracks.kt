package eu.infinitedrive.app

data class TrackSpec(
    val id: String,
    val title: String,
    val artist: String,
    val phase: String
)

object FightModeCatalog {
    val tracks = listOf(
        TrackSpec("01", "Till I Collapse", "Eminem", "IGNITION"),
        TrackSpec("02", "Welcome to the Circus", "Five Finger Death Punch", "IGNITION"),
        TrackSpec("03", "Faint", "Linkin Park", "BUILD"),
        TrackSpec("04", "Last Resort", "Papa Roach", "BUILD"),
        TrackSpec("05", "Indestructible", "Disturbed", "BUILD"),
        TrackSpec("06", "Survival", "Eminem", "ATTACK"),
        TrackSpec("07", "Jekyll and Hyde", "Five Finger Death Punch", "ATTACK"),
        TrackSpec("08", "Throne", "Bring Me The Horizon", "ATTACK"),
        TrackSpec("09", "Omen", "The Prodigy", "ATTACK"),
        TrackSpec("10", "Blah Blah Blah", "Armin van Buuren", "REDLINE"),
        TrackSpec("11", "Lose Yourself", "Eminem", "REDLINE"),
        TrackSpec("12", "Eye of the Tiger", "Survivor", "REDLINE"),
        TrackSpec("13", "Going the Distance", "Bill Conti", "FINISH")
    )

    fun byId(id: String?): TrackSpec? = tracks.firstOrNull { it.id == id }
}
