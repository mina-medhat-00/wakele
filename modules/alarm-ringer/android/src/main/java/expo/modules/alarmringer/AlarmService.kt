package expo.modules.alarmringer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Foreground service that loops the alarm sound (any length, restarting from the
 * beginning when it ends) until the app calls stopRinging after the Wordle is solved.
 */
class AlarmService : Service() {
  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var savedVolume: Int? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // A null intent means the system restarted us (START_STICKY) after killing the
    // process mid-ring: resume whatever was ringing, or stop if nothing was.
    val saved = RingingState.load(this)
    val alarmId = intent?.getStringExtra(EXTRA_ALARM_ID) ?: saved?.alarmId
    if (alarmId == null) {
      stopSelf()
      return START_NOT_STICKY
    }
    val label = intent?.getStringExtra(EXTRA_LABEL) ?: saved?.label ?: "Alarm"
    val url = intent?.getStringExtra(EXTRA_URL) ?: saved?.url

    startInForeground(buildNotification(label, url))

    RingingState.save(this, RingingState(alarmId, label, url))
    ringingAlarmId = alarmId
    ensureAudible()
    startSound()
    startVibration()
    acquireWakeLock()
    onRing?.invoke(alarmId)

    return START_STICKY
  }

  override fun onDestroy() {
    player?.run {
      stop()
      release()
    }
    player = null
    vibrator?.cancel()
    wakeLock?.takeIf { it.isHeld }?.release()
    restoreVolume()
    RingingState.clear(this)
    ringingAlarmId = null
    super.onDestroy()
  }

  /** An alarm at volume 0 would be silent; raise it for this ring and restore it after. */
  private fun ensureAudible() {
    if (savedVolume != null) return
    val audio = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val current = audio.getStreamVolume(AudioManager.STREAM_ALARM)
    if (current == 0) {
      val max = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM)
      try {
        audio.setStreamVolume(AudioManager.STREAM_ALARM, (max * 0.6).toInt().coerceAtLeast(1), 0)
        savedVolume = current
      } catch (_: SecurityException) {
        // Do Not Disturb policy can forbid volume changes; nothing more we can do.
      }
    }
  }

  private fun restoreVolume() {
    val volume = savedVolume ?: return
    val audio = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    try {
      audio.setStreamVolume(AudioManager.STREAM_ALARM, volume, 0)
    } catch (_: SecurityException) {
    }
    savedVolume = null
  }

  private fun startSound() {
    if (player?.isPlaying == true) return

    val resId = resources.getIdentifier(SOUND_NAME, "raw", packageName)
    val bundled = if (resId != 0) Uri.parse("android.resource://$packageName/$resId") else null
    val fallback = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

    // Try the app's sound first; if it's missing or can't be decoded, use the system alarm.
    player = listOfNotNull(bundled, fallback).firstNotNullOfOrNull(::createLoopingPlayer)
  }

  private fun createLoopingPlayer(source: Uri): MediaPlayer? {
    val mp = MediaPlayer()
    return try {
      mp.setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build(),
      )
      mp.setDataSource(this, source)
      mp.isLooping = true
      mp.prepare()
      mp.start()
      mp
    } catch (e: Exception) {
      mp.release()
      null
    }
  }

  private fun startVibration() {
    val v = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
    vibrator = v
    val pattern = longArrayOf(0, 800, 800)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      v.vibrate(VibrationEffect.createWaveform(pattern, 0))
    } else {
      @Suppress("DEPRECATION")
      v.vibrate(pattern, 0)
    }
  }

  private fun acquireWakeLock() {
    if (wakeLock?.isHeld == true) return
    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "wakele:alarm").apply {
      // Safety net so a forgotten alarm can't drain the battery forever.
      acquire(60 * 60 * 1000L)
    }
  }

  private fun startInForeground(notification: Notification) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun buildNotification(label: String, url: String?): Notification {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Ringing alarm", NotificationManager.IMPORTANCE_HIGH).apply {
          description = "Shown while an alarm is ringing"
          setSound(null, null) // the service plays the looping sound itself
          enableVibration(false)
          lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        },
      )
    }

    val openIntent = openAppIntent(this, url, NOTIFICATION_ID)
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this).setPriority(Notification.PRIORITY_MAX)
    }

    return builder
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(label)
      .setContentText("Solve the Wordle to stop the alarm")
      .setCategory(Notification.CATEGORY_ALARM)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setContentIntent(openIntent)
      .setFullScreenIntent(openIntent, true)
      .build()
  }

  companion object {
    private const val CHANNEL_ID = "alarm-ringing"
    private const val NOTIFICATION_ID = 7301
    private const val SOUND_NAME = "alarm" // res/raw/alarm.* (copied from assets/sounds by expo-notifications)
    private const val EXTRA_ALARM_ID = "alarmId"
    private const val EXTRA_LABEL = "label"
    private const val EXTRA_URL = "url"

    @Volatile var ringingAlarmId: String? = null
      private set

    /** Set by the JS module so the app can react when an alarm starts while it is open. */
    @Volatile var onRing: ((String) -> Unit)? = null

    fun start(context: Context, alarmId: String, label: String, url: String?) {
      val intent = Intent(context, AlarmService::class.java)
        .putExtra(EXTRA_ALARM_ID, alarmId)
        .putExtra(EXTRA_LABEL, label)
        .putExtra(EXTRA_URL, url)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, AlarmService::class.java))
    }

    /** Opens the app's main activity on the given deep link (the ring screen). */
    fun openAppIntent(context: Context, url: String?, requestCode: Int): PendingIntent {
      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        ?: Intent().setPackage(context.packageName)
      val intent = Intent(Intent.ACTION_VIEW).apply {
        component = launch.component
        if (url != null) data = Uri.parse(url)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      }
      return PendingIntent.getActivity(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
  }
}

/** What is currently ringing, persisted so a restarted service can resume it. */
data class RingingState(val alarmId: String, val label: String, val url: String?) {
  companion object {
    private const val PREFS = "expo.modules.alarmringer.ringing"

    private fun prefs(context: Context) =
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun save(context: Context, state: RingingState) {
      prefs(context).edit()
        .putString("alarmId", state.alarmId)
        .putString("label", state.label)
        .putString("url", state.url)
        .commit()
    }

    fun load(context: Context): RingingState? {
      val p = prefs(context)
      val alarmId = p.getString("alarmId", null) ?: return null
      return RingingState(alarmId, p.getString("label", null) ?: "Alarm", p.getString("url", null))
    }

    fun clear(context: Context) {
      prefs(context).edit().clear().commit()
    }
  }
}
