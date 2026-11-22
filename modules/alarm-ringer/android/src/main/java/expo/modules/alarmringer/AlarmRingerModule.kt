package expo.modules.alarmringer

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class ScheduleOptions : Record {
  @Field val key: String = ""
  @Field val alarmId: String = ""
  @Field val hour: Int = 0
  @Field val minute: Int = 0
  /** 0 = Monday … 6 = Sunday; null for a one-time alarm. */
  @Field val weekday: Int? = null
  @Field val label: String = "Alarm"
  @Field val url: String = ""
}

class AlarmRingerModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AlarmRinger")

    Events("onRing")

    OnCreate {
      AlarmService.onRing = { alarmId -> sendEvent("onRing", mapOf("alarmId" to alarmId)) }
    }

    OnDestroy {
      AlarmService.onRing = null
    }

    /** Schedules (or reschedules) one occurrence; returns its next trigger in epoch millis. */
    Function("schedule") { options: ScheduleOptions ->
      require(options.key.isNotEmpty()) { "key is required" }
      require(options.hour in 0..23 && options.minute in 0..59) { "invalid time" }
      require(options.weekday == null || options.weekday in 0..6) { "invalid weekday" }
      AlarmScheduler.schedule(
        context,
        StoredAlarm(
          key = options.key,
          alarmId = options.alarmId,
          hour = options.hour,
          minute = options.minute,
          weekday = options.weekday,
          label = options.label,
          url = options.url,
          triggerAt = 0,
        ),
      ).triggerAt.toDouble()
    }

    Function("cancel") { key: String ->
      AlarmScheduler.cancel(context, key)
    }

    /** Keys of every occurrence that is still scheduled. */
    Function("getScheduledKeys") {
      AlarmStore.all(context).map { it.key }
    }

    /** Re-arms all stored alarms (AlarmManager drops them when the app is force-stopped). */
    Function("rearmAll") {
      AlarmScheduler.rearmAll(context, dropMissed = false)
    }

    Function("startRinging") { alarmId: String, label: String, url: String ->
      AlarmService.start(context, alarmId, label, url)
    }

    Function("stopRinging") {
      AlarmService.stop(context)
      appContext.currentActivity?.let { activity ->
        activity.runOnUiThread { AlarmRingerPackage.setShowOverLockScreen(activity, false) }
      }
    }

    // Only what the live service reports: a persisted RingingState can be stale (a
    // force-stop kills the service without onDestroy), and a legitimately restarted
    // service sets ringingAlarmId before any JS runs and emits onRing anyway.
    Function("getRingingAlarmId") {
      AlarmService.ringingAlarmId
    }

    Function("canScheduleExactAlarms") {
      AlarmScheduler.canScheduleExact(context)
    }
  }
}
