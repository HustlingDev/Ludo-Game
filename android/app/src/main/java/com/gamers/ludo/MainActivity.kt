package com.gamers.ludo

import android.annotation.SuppressLint
import android.app.Dialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.CommonStatusCodes
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var googleSignInClient: GoogleSignInClient
    private lateinit var googleSignInLauncher: ActivityResultLauncher<Intent>

    companion object {
        private const val TAG = "LudoMainActivity"
        // Web Client ID (client_type: 3) from google-services.json for ID token generation
        private const val WEB_CLIENT_ID = "999191211236-nmaml6uoqtb0o9v3sdq1nk28rjfimp6c.apps.googleusercontent.com"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Enable immersive full-screen display for game experience
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        )

        // Setup native Google Sign In with device Google Account Chooser
        initGoogleSignIn()

        // Enable cookies and third-party cookies for Firebase Auth & Google OAuth
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)

        // Set up secure WebViewAssetLoader to serve bundled web assets from android/app/src/main/assets/dist/
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(this))
            .build()

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.javaScriptCanOpenWindowsAutomatically = true
            settings.setSupportMultipleWindows(true)
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.mediaPlaybackRequiresUserGesture = false
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.setSupportZoom(false)

            // Remove "; wv" from user-agent to allow Google OAuth login inside WebView without disallowed_useragent error
            val defaultUa = settings.userAgentString
            settings.userAgentString = defaultUa.replace("; wv", "")

            cookieManager.setAcceptThirdPartyCookies(this, true)

            // Register native bridge for device Google Account selection
            addJavascriptInterface(AndroidAuthInterface(), "AndroidApp")

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView?,
                    request: WebResourceRequest?
                ): WebResourceResponse? {
                    val url = request?.url ?: return null
                    return assetLoader.shouldInterceptRequest(url)
                }

                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    // Keep all navigation and auth handshakes within the in-app WebView
                    return false
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onCreateWindow(
                    view: WebView?,
                    isDialog: Boolean,
                    isUserGesture: Boolean,
                    resultMsg: Message?
                ): Boolean {
                    // Create in-app popup dialog for Google OAuth signInWithPopup fallback
                    val popupWebView = WebView(this@MainActivity).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.databaseEnabled = true
                        settings.setSupportZoom(true)
                        val popupUa = settings.userAgentString
                        settings.userAgentString = popupUa.replace("; wv", "")
                        cookieManager.setAcceptThirdPartyCookies(this, true)
                    }

                    val authDialog = Dialog(this@MainActivity, android.R.style.Theme_Black_NoTitleBar_Fullscreen).apply {
                        setContentView(popupWebView)
                        show()
                    }

                    popupWebView.webChromeClient = object : WebChromeClient() {
                        override fun onCloseWindow(window: WebView?) {
                            if (authDialog.isShowing) {
                                authDialog.dismiss()
                            }
                        }
                    }

                    popupWebView.webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(
                            view: WebView?,
                            request: WebResourceRequest?
                        ): Boolean {
                            return false
                        }
                    }

                    val transport = resultMsg?.obj as? WebView.WebViewTransport
                    transport?.webView = popupWebView
                    resultMsg?.sendToTarget()
                    return true
                }
            }
        }

        setContentView(webView)

        // Load the bundled offline-first application from local assets
        webView.loadUrl("https://appassets.androidplatform.net/assets/dist/index.html")
    }

    private fun initGoogleSignIn() {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(WEB_CLIENT_ID)
            .requestEmail()
            .requestProfile()
            .build()

        googleSignInClient = GoogleSignIn.getClient(this, gso)

        googleSignInLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account: GoogleSignInAccount = task.getResult(ApiException::class.java)
                val idToken = account.idToken
                val email = account.email ?: ""
                val displayName = account.displayName ?: ""
                val photoUrl = account.photoUrl?.toString() ?: ""

                if (!idToken.isNullOrEmpty()) {
                    Log.d(TAG, "Native device Google Account selected: $email")
                    val payload = JSONObject().apply {
                        put("idToken", idToken)
                        put("email", email)
                        put("displayName", displayName)
                        put("photoUrl", photoUrl)
                    }
                    runOnUiThread {
                        webView.evaluateJavascript(
                            "window.onNativeGoogleSignInSuccess && window.onNativeGoogleSignInSuccess(${payload.toString()});",
                            null
                        )
                    }
                } else {
                    Log.e(TAG, "Native Google Sign In returned empty token")
                    notifyJsError("Failed to obtain Google ID token from selected account.")
                }
            } catch (e: ApiException) {
                Log.e(TAG, "Google Sign In ApiException statusCode=${e.statusCode}", e)
                val message = when (e.statusCode) {
                    CommonStatusCodes.SIGN_IN_REQUIRED -> "Sign in required"
                    12501 -> "Sign-in cancelled. Please choose your Google account."
                    12500 -> "Sign-in failed. Please verify Google Play Services is up to date."
                    10 -> "Configuration error (code 10). Make sure SHA-1 fingerprint is registered."
                    else -> "Sign-in error: code ${e.statusCode}"
                }
                notifyJsError(message)
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected Google Sign-in error", e)
                notifyJsError(e.message ?: "Unknown sign-in error")
            }
        }
    }

    fun launchGoogleSignIn() {
        // Sign out first so the native Android Account Chooser dialog ALWAYS shows all device accounts!
        googleSignInClient.signOut().addOnCompleteListener {
            try {
                val signInIntent = googleSignInClient.signInIntent
                googleSignInLauncher.launch(signInIntent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to launch Google Sign In Intent", e)
                notifyJsError("Unable to open Google Account selector: ${e.message}")
            }
        }
    }

    private fun notifyJsError(message: String) {
        val safeMsg = JSONObject.quote(message)
        runOnUiThread {
            webView.evaluateJavascript(
                "window.onNativeGoogleSignInError && window.onNativeGoogleSignInError($safeMsg);",
                null
            )
        }
    }

    inner class AndroidAuthInterface {
        @JavascriptInterface
        fun signInWithGoogle() {
            runOnUiThread {
                launchGoogleSignIn()
            }
        }

        @JavascriptInterface
        fun signOut() {
            runOnUiThread {
                googleSignInClient.signOut()
            }
        }

        @JavascriptInterface
        fun isNativeApp(): Boolean {
            return true
        }
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
