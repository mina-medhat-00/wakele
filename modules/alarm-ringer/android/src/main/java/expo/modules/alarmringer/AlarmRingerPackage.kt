package expo.modules.alarmringer

import android.app.Activity
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/** Lets the ring screen appear over the lock screen and wake the display while ringing. */
class AlarmRingerPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> =
    listOf(object : ReactActivityLifecycleListener {
      override fun onCreate(activity: Activity, savedInstanceState: Bundle?) = update(activity)
      override fun onResume(activity: Activity) = update(activity)
    })

  companion object {
    private fun update(activity: Activity) =
      setShowOverLockScreen(activity, AlarmService.ringingAlarmId != null)

    fun setShowOverLockScreen(activity: Activity, show: Boolean) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        activity.setShowWhenLocked(show)
        activity.setTurnScreenOn(show)
      } else {
        @Suppress("DEPRECATION")
        val flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        if (show) activity.window.addFlags(flags) else activity.window.clearFlags(flags)
      }
    }
  }
}
