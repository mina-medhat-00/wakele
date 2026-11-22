package expo.modules.alarmringer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Fired by AlarmManager when an alarm is due: starts ringing and re-arms weekly alarms. */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val key = intent.getStringExtra(AlarmScheduler.EXTRA_KEY) ?: return
    val alarm = AlarmStore.get(context, key) ?: return // cancelled in the meantime

    if (alarm.repeatWeekly) {
      AlarmScheduler.schedule(context, alarm) // next week, same wall-clock time
    } else {
      AlarmStore.remove(context, key)
    }

    AlarmService.start(context, alarm.alarmId, alarm.label, alarm.url)
  }
}

/** Re-arms alarms after reboot, app update, or a clock / time-zone change. */
class SystemEventsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val booted = intent.action == Intent.ACTION_BOOT_COMPLETED ||
      intent.action == Intent.ACTION_LOCKED_BOOT_COMPLETED
    AlarmScheduler.rearmAll(context, dropMissed = booted)
  }
}
