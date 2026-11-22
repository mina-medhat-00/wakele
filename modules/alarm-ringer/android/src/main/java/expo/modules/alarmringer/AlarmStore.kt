package expo.modules.alarmringer

import android.content.Context
import org.json.JSONException
import org.json.JSONObject

/**
 * One scheduled occurrence. Stored as wall-clock time (hour/minute/weekday) rather than
 * only an absolute instant, so it can be recomputed after time-zone or clock changes.
 */
data class StoredAlarm(
  val key: String,
  val alarmId: String,
  val hour: Int,
  val minute: Int,
  /** 0 = Monday … 6 = Sunday for a weekly alarm; null for a one-time alarm. */
  val weekday: Int?,
  val label: String,
  val url: String,
  /** Epoch millis of the next ring. */
  val triggerAt: Long,
) {
  val repeatWeekly: Boolean get() = weekday != null

  fun toJson(): String = JSONObject()
    .put("key", key)
    .put("alarmId", alarmId)
    .put("hour", hour)
    .put("minute", minute)
    .put("weekday", weekday ?: JSONObject.NULL)
    .put("label", label)
    .put("url", url)
    .put("triggerAt", triggerAt)
    .toString()

  companion object {
    fun fromJson(json: String): StoredAlarm? = try {
      val o = JSONObject(json)
      StoredAlarm(
        key = o.getString("key"),
        alarmId = o.getString("alarmId"),
        hour = o.getInt("hour"),
        minute = o.getInt("minute"),
        weekday = if (o.isNull("weekday")) null else o.getInt("weekday"),
        label = o.optString("label", "Alarm"),
        url = o.getString("url"),
        triggerAt = o.getLong("triggerAt"),
      )
    } catch (_: JSONException) {
      null // entry from an older format or corrupted: ignore it
    }
  }
}

object AlarmStore {
  private const val PREFS = "expo.modules.alarmringer.alarms"

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun put(context: Context, alarm: StoredAlarm) {
    prefs(context).edit().putString(alarm.key, alarm.toJson()).commit()
  }

  fun get(context: Context, key: String): StoredAlarm? =
    prefs(context).getString(key, null)?.let(StoredAlarm::fromJson)

  fun remove(context: Context, key: String) {
    prefs(context).edit().remove(key).commit()
  }

  /** All stored alarms; unreadable entries (older formats) are deleted on the way. */
  fun all(context: Context): List<StoredAlarm> {
    val entries = prefs(context).all
    val parsed = entries.mapValues { (_, value) -> (value as? String)?.let(StoredAlarm::fromJson) }
    val broken = parsed.filterValues { it == null }.keys
    if (broken.isNotEmpty()) {
      prefs(context).edit().apply { broken.forEach(::remove) }.commit()
    }
    return parsed.values.filterNotNull()
  }
}
