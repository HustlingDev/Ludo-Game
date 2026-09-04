# ProGuard rules for Ludo Realtime Multiplayer Android App

# Keep Kotlin reflection metadata
-keepclassmembers class * {
    @org.jetbrains.annotations.* <fields>;
}

# Keep WebKit and JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep AndroidX & Material
-keep class androidx.appcompat.** { *; }
-keep class androidx.webkit.** { *; }
-keep class com.google.android.material.** { *; }

# Keep Firebase classes
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep Google Play Services Auth
-keep class com.google.android.gms.auth.** { *; }
-dontwarn com.google.android.gms.auth.**
