package expo.modules.alarmringer

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

object AlarmScheduler {
  const val EXTRA_KEY = "expo.modules.alarmringer.KEY"

  private fun alarmManager(context: Context) =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun firePendingIntent(context: Context, key: String): PendingIntent {
    val intent = Intent(context, AlarmReceiver::class.java)
      .setAction("expo.modules.alarmringer.FIRE.$key") // unique per key
      .putExtra(EXTRA_KEY, key)
    return PendingIntent.getBroadcast(
      context,
      key.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  fun canScheduleExact(context: Context): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager(context).canScheduleExactAlarms()

  /**
   * Next time (strictly after [now]) that is [hour]:[minute] local time, on [weekday]
   * (0 = Monday … 6 = Sunday) when given. Calendar arithmetic keeps DST transitions correct.
   */
  fun nextTrigger(hour: Int, minute: Int, weekday: Int?, now: Long = System.currentTimeMillis()): Long {
    val calendar = Calendar.getInstance().apply {
      timeInMillis = now
      set(Calendar.HOUR_OF_DAY, hour)
      set(Calendar.MINUTE, minute)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }
    if (calendar.timeInMillis <= now) calendar.add(Calendar.DAY_OF_YEAR, 1)
    if (weekday != null) {
      // Calendar: SUNDAY = 1 … SATURDAY = 7; ours: MONDAY = 0 … SUNDAY = 6.
      val target = (weekday + 1) % 7 + 1
      while (calendar.get(Calendar.DAY_OF_WEEK) != target) calendar.add(Calendar.DAY_OF_YEAR, 1)
    }
    return calendar.timeInMillis
  }

  /** Computes the next trigger, persists the alarm and arms it with AlarmManager. */
  fun schedule(context: Context, alarm: StoredAlarm): StoredAlarm {
    val armed = alarm.copy(triggerAt = nextTrigger(alarm.hour, alarm.minute, alarm.weekday))
    AlarmStore.put(context, armed)
    arm(context, armed)
    return armed
  }

  private fun arm(context: Context, alarm: StoredAlarm) {
    val manager = alarmManager(context)
    val operation = firePendingIntent(context, alarm.key)

    if (canScheduleExact(context)) {
      // setAlarmClock is exact, survives Doze, and shows the alarm icon in the status bar.
      val showIntent = AlarmService.openAppIntent(context, alarm.url, alarm.key.hashCode())
      manager.setAlarmClock(AlarmManager.AlarmClockInfo(alarm.triggerAt, showIntent), operation)
    } else {
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarm.triggerAt, operation)
    }
  }

  fun cancel(context: Context, key: String) {
    alarmManager(context).cancel(firePendingIntent(context, key))
    AlarmStore.remove(context, key)
  }

  /**
   * Re-arms every stored alarm. AlarmManager forgets alarms on reboot and when the app is
   * force-stopped, and absolute trigger times go stale when the clock or time zone changes.
   * One-time alarms whose time already passed were missed (device off) and are dropped.
   */
  fun rearmAll(context: Context, dropMissed: Boolean) {
    val now = System.currentTimeMillis()
    for (alarm in AlarmStore.all(context)) {
      if (dropMissed && !alarm.repeatWeekly && alarm.triggerAt <= now) {
        cancel(context, alarm.key)
      } else {
        schedule(context, alarm)
      }
    }
  }
}
