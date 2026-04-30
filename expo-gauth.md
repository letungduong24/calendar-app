A guide on using @react-native-google-signin/google-signin library to integrate Google authentication in your Expo project.

For the complete documentation index, see llms.txt. Use this file to discover all available pages.

The @react-native-google-signin/google-signin library provides a way to integrate Google authentication in your Expo app. It also provides native sign-in buttons and supports authenticating the user as well as obtaining their authorization to use Google APIs. You can use the library in your project by adding the config plugin in the app config.

This guide provides information on how to configure the library for your project.

Prerequisites

1 requirement

A development build
The @react-native-google-signin/google-signin library can't be used in Expo Go because it requires custom native code. Learn more about adding custom native code to your app.

Installation
See @react-native-google-signin/google-signin documentation for instructions on how to install and configure the library:

React Native Google Sign In: Expo installation instructions
Configure Google project for Android and iOS
Below are instructions on how to configure your Google project for Android and iOS.

Upload app to Google Play Store
We recommend uploading the app to the Google Play Store if your app intends to run in production. You can submit your app to the stores for testing even if your project is still in development. This allows you to test Google Sign In when your app is signed by EAS for testing, and when it is signed by Google Play App Signing for store deployment. To learn more about the app submission process, see the guides below in the order they are specified:

Create your first EAS Build
Build your project for app stores
Manually upload Android app for the first time
Configure your Firebase or Google Cloud Console project
Refer to the library's documentation for a more in-depth configuration guide.

For Android, once you have uploaded your app, you need to provide the SHA-1 certificate fingerprint values when asked while configuring the project in Firebase or Google Cloud Console. There are two types of values that you can provide:

Fingerprint of the .apk you built (on your machine or using EAS Build). You can find the SHA-1 certificate fingerprint in the Google Play Console under Release > Setup > App Integrity > Upload key certificate.
Fingerprint(s) of a production app downloaded from the play store. You can find the SHA-1 certificate fingerprint(s) in the Google Play Console under Release > Setup > App Integrity > App signing key certificate.
With Firebase
For more instructions on how to configure your project for Android and iOS with Firebase:

Firebase
Upload google-services.json and GoogleService-Info.plist to EAS
If you use the Firebase method for Android and iOS (as shared in sections above), you'll need to make sure google-services.json and GoogleService-Info.plist are available in EAS for building the app. You can check them into your repository because the files should not contain sensitive values, or you can treat the files as secrets, add them to .gitignore and use the guide below to make them available in EAS.

Upload a secret file to EAS and use in the app config
With Google Cloud Console
This is an alternate method to configure a Google project when you are not using Firebase.

For more instructions on how to configure your Google project Android and iOS with Google Cloud Console:

Expo without Firebase

Original Google sign in
tip
To migrate to Universal sign in, follow this guide.

This module exposes

Legacy Google Sign-In for Android. The underlying SDK is deprecated but remains functional.
Google Sign-In SDK for iOS and macOS (macOS support is only available to in the paid version).
imports example
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

configure
signature: (options: ConfigureParams) => void

It is mandatory to call this method before attempting to call signIn() and signInSilently(). This method is synchronous, meaning you can call signIn / signInSilently right after it. Typically, you would call configure only once, soon after your app starts. All parameters are optional.

Example usage with default options: you'll get user email and basic profile info.

import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure();

An example with all options enumerated:

GoogleSignin.configure({
  webClientId: '<FROM DEVELOPER CONSOLE>', // client ID of type WEB for your server. Required to get the `idToken` on the user object, and for offline access.
  scopes: [
    /* what APIs you want to access on behalf of the user, default is email and profile
    this is just an example, most likely you don't need this option at all! */
    'https://www.googleapis.com/auth/drive.readonly',
  ],
  offlineAccess: false, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  hostedDomain: '', // specifies a hosted domain restriction
  forceCodeForRefreshToken: false, // [Android] related to `serverAuthCode`, read the docs link below *.
  accountName: '', // [Android] specifies an account name on the device that should be used
  iosClientId: '<FROM DEVELOPER CONSOLE>', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
  googleServicePlistPath: '', // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. "GoogleService-Info-Staging"
  openIdRealm: '', // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
  profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
});


* forceCodeForRefreshToken docs

signIn
signature: (options: SignInParams) => Promise<SignInResponse>

Prompts a modal to let the user sign in into your application. Resolved promise returns an SignInResponse object. Rejects with an error otherwise.

signIn example
// import statusCodes along with GoogleSignin
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Somewhere in your code
const signIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (isSuccessResponse(response)) {
      setState({ userInfo: response.data });
    } else {
      // sign in was cancelled by user
    }
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          // operation (eg. sign in) already in progress
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          // Android only, play services not available or outdated
          break;
        default:
        // some other error happened
      }
    } else {
      // an error that's not related to google sign in occurred
    }
  }
};


Utility Functions
tip
There are 4 helper functions available:

isErrorWithCode for processing errors
isSuccessResponse for checking if a response represents a successful operation. Same as checking response.type === 'success'.
isNoSavedCredentialFoundResponse for checking if a response represents no saved credentials case. Same as checking response.type === 'noSavedCredentialFound'.
isCancelledResponse for checking if a response represents user cancellation case. Same as checking response.type === 'cancelled'.
addScopes
signature: (options: AddScopesParams) => Promise<SignInResponse | null>

This method resolves with SignInResponse object or with null if no user is currently logged in.

You may not need this call: you can supply required scopes to the configure call. However, if you want to gain access to more scopes later, use this call.

Example:

const response = await GoogleSignin.addScopes({
  scopes: ['https://www.googleapis.com/auth/user.gender.read'],
});

signInSilently
signature: () => Promise<SignInSilentlyResponse>

May be called e.g. after of your main component mounts. This method returns a Promise that resolves with the SignInSilentlyResponse object and rejects with an error otherwise.

To see how to handle errors read signIn() method

const getCurrentUser = async () => {
  try {
    const response = await GoogleSignin.signInSilently();
    if (isSuccessResponse(response)) {
      setState({ userInfo: response.data });
    } else if (isNoSavedCredentialFoundResponse(response)) {
      // user has not signed in yet, or they have revoked access
    }
  } catch (error) {
    // handle errror
  }
};

hasPreviousSignIn
signature: () => boolean

This synchronous method may be used to find out whether some user previously signed in.

Note that hasPreviousSignIn() can return true but getCurrentUser() can return null, in which case you can call signInSilently() to recover the user. However, it may happen that calling signInSilently() rejects with an error (e.g. due to a network issue).

const hasPreviousSignIn = async () => {
  const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
  setState({ hasPreviousSignIn });
};

getCurrentUser
signature: () => User | null

This is a synchronous method that returns null or User object of the currently signed-in user.

const getCurrentUser = async () => {
  const currentUser = GoogleSignin.getCurrentUser();
  setState({ currentUser });
};

clearCachedAccessToken
signature: (accessTokenString: string) => Promise<null>

This method only has an effect on Android. You may run into a 401 Unauthorized error when a token is invalid. Call this method to remove the token from local cache and then call getTokens() to get fresh tokens. Calling this method on iOS does nothing and always resolves. This is because on iOS, getTokens() always returns valid tokens, refreshing them first if they have expired or are about to expire (see docs).

getTokens
signature: () => Promise<GetTokensResponse>

Resolves with an object containing { idToken: string, accessToken: string, } or rejects with an error. Note that using accessToken for identity assertion on your backend server is discouraged.

signOut
signature: () => Promise<null>

Signs out the current user.

const signOut = async () => {
  try {
    await GoogleSignin.signOut();
    setState({ user: null }); // Remember to remove the user from your app's state as well
  } catch (error) {
    console.error(error);
  }
};

revokeAccess
signature: () => Promise<null>

Removes your application from the user authorized applications. Read more about it here and here.

const revokeAccess = async () => {
  try {
    await GoogleSignin.revokeAccess();
    // Google Account disconnected from your app.
    // Perform clean-up actions, such as deleting data associated with the disconnected account.
  } catch (error) {
    console.error(error);
  }
};

hasPlayServices
signature: (options: HasPlayServicesParams) => Promise<boolean>

Checks if device has Google Play Services installed. Always resolves to true on iOS.

Presence of up-to-date Google Play Services is required to show the sign in modal, but it is not required to perform calls to configure and signInSilently. Therefore, we recommend to call hasPlayServices directly before signIn.

try {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // google services are available
} catch (err) {
  console.error('play services are not available');
}

hasPlayServices accepts one parameter, an object which contains a single key: showPlayServicesUpdateDialog (defaults to true). When showPlayServicesUpdateDialog is set to true the library prompts the user to take action to solve the issue, as seen in the figure below.

You may also use this call at any time to find out if Google Play Services are available and react to the result as necessary.

GoogleSigninButton
tip
Prefer using the Google logo button instead — it's more customizable and visually appealing.

This is the native sign in button that you can use in iOS and Android apps. It renders null when used on the web. On macOS, a simplified version of the button is rendered because the native SDK does not offer a button component for macOS.

The reason why you might want to use this native button is that it's localized out of the box, so the label will be translated to the currently active language automatically (if your localization is set up correctly—doing that is out of scope for this guide).

signin button

import { GoogleSigninButton } from '@react-native-google-signin/google-signin';

<GoogleSigninButton
  size={GoogleSigninButton.Size.Wide}
  color={GoogleSigninButton.Color.Dark}
  onPress={() => {
    // initiate sign in
  }}
  disabled={isInProgress}
/>;

Props
size
Possible values:

Size.Icon: display only Google icon. Recommended size of 48 x 48.
Size.Standard: icon with 'Sign in'. Recommended size of 230 x 48.
Size.Wide: icon with 'Sign in with Google'. Recommended size of 312 x 48.
Default: GoogleSigninButton.Size.Standard. Given the size prop you pass, we'll automatically apply the recommended size, but you can override it by passing the style prop as in style={{ width, height }}.

color
Possible values:

Color.Dark: apply a blue background
Color.Light: apply a light gray background
disabled
Boolean. If true, all interactions for the button are disabled.

onPress
Handler to be called when the user taps the button

Inherited View props...

Universal sign in
This is Google's recommended way to implement Google Sign In. This API is available on Android, iOS, macOS and web (with a little extra work described below). It is a replacement for the Original Google sign in. The module APIs are named GoogleOneTapSignIn for historical reasons.

tip
The functionality covered in this page is available in the licensed version. You can get a license here ⭐️.

On Android, it is built on top of the new Credential Manager APIs.

On Apple (iOS and macOS), it is built on top of the Google Sign In SDK for iOS and macOS.

On the web, it covers both the One-tap flow and the Google Sign-In button. Learn more.

Usage
You can copy-paste this snippet to get a complete sign-in flow quickly. Read more about the methods below.

example of going through the sign in flow
import {
  GoogleOneTapSignIn,
  GoogleLogoButton,
} from '@react-native-google-signin/google-signin';

<GoogleLogoButton onPress={startSignInFlow} label="Sign in with Google" />;

const startSignInFlow = async () => {
  try {
    GoogleOneTapSignIn.configure(); // move this to after your app starts
    await GoogleOneTapSignIn.checkPlayServices();
    const signInResponse = await GoogleOneTapSignIn.signIn();
    if (signInResponse.type === 'success') {
      // use signInResponse.data
    } else if (signInResponse.type === 'noSavedCredentialFound') {
      // the user wasn't previously signed into this app
      const createResponse = await GoogleOneTapSignIn.createAccount();
      if (createResponse.type === 'success') {
        // use createResponse.data
      } else if (createResponse.type === 'noSavedCredentialFound') {
        // no Google user account was present on the device yet (unlikely but possible)
        const explicitResponse =
          await GoogleOneTapSignIn.presentExplicitSignIn();

        if (explicitResponse.type === 'success') {
          // use explicitResponse.data
        }
      }
    }
    // the else branches correspond to the user canceling the sign in
  } catch (error) {
    // handle error
  }
};


Note that on Apple and Android, you can combine the Universal sign in methods with those one from the Original Google Sign In. To do that, use the Universal sign in to sign in the user. Then call signInSilently() and then (for example) getCurrentUser() to get the current user's information. However, this shouldn't be necessary because this module should cover all your needs. Please open an issue if that's not the case.

Methods
configure
signature: (params: OneTapConfigureParams) => void

It is mandatory to call configure before attempting to call any of the sign-in methods. This method is synchronous, meaning you can call e.g. signIn right after it. Typically, you would call configure only once, soon after your app starts.

webClientId is a required parameter. Use "autoDetect" for automatic webClientId detection.

If you're using neither Expo nor Firebase, you also need to provide the iosClientId parameter. All other parameters are optional.

Example of calling the configure() method
GoogleOneTapSignIn.configure({
  webClientId: 'autoDetect',
});

signIn
signature: (params?: OneTapSignInParams) => Promise<OneTapResponse>

Platform	Behavior
Android	Attempts to sign in user automatically, without interaction. Docs.
Apple	Attempts to restore a previous user sign-in without interaction. Docs.
Web	Attempts to sign in user automatically, without interaction. Docs. If none is found, presents a sign-in UI. Read below for web support.
If there is no user that was previously signed in, the returned promise resolves with NoSavedCredentialFound object. In that case, you can call createAccount to start a flow to create a new account. You don't need to call signIn as a response to a user action - you can call it when your app starts or when suitable.

UI screenshots
Example code snippet
Example of calling the signIn() method
import {
  GoogleOneTapSignIn,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
} from '@react-native-google-signin/google-signin';

// Somewhere in your code
const signIn = async () => {
  try {
    await GoogleOneTapSignIn.checkPlayServices();
    const response = await GoogleOneTapSignIn.signIn();

    if (isSuccessResponse(response)) {
      // read user's info
      console.log(response.data);
    } else if (isNoSavedCredentialFoundResponse(response)) {
      // Android and Apple only.
      // No saved credential found (user has not signed in yet, or they revoked access)
      // call `createAccount()`
    }
  } catch (error) {
    console.error(error);
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.ONE_TAP_START_FAILED:
          // Android-only, you probably have hit rate limiting.
          // You can still call `presentExplicitSignIn` in this case.
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          // Android: play services not available or outdated.
          // Get more details from `error.userInfo`.
          // Web: when calling an unimplemented api (requestAuthorization)
          // or when the Google Client Library is not loaded yet.
          break;
        default:
        // something else happened
      }
    } else {
      // an error that's not related to google sign in occurred
    }
  }
};


Utility Functions
tip
There are 4 helper functions available:

isErrorWithCode for processing errors
isSuccessResponse for checking if a response represents a successful operation. Same as checking response.type === 'success'.
isNoSavedCredentialFoundResponse for checking if a response represents no saved credentials case. Same as checking response.type === 'noSavedCredentialFound'.
isCancelledResponse for checking if a response represents user cancellation case. Same as checking response.type === 'cancelled'.
createAccount
signature: (params?: OneTapCreateAccountParams) => Promise<OneTapResponse>

Platform	Behavior
Android	Starts a flow to sign in with your app for the first time (to create a user account). It offers a list of user accounts to choose from (multiple Google accounts can be logged in on the device).
Apple	Starts an interactive sign-in flow. Docs. It offers a list of user accounts to choose from (multiple Google accounts can be logged in on the device).
Web	Presents a one-tap prompt and waits for user interaction (it will not sign in automatically). The prompt has a slightly different styling than with signIn (configrable via the context param). Read below for web support.
You don't need to call createAccount as a response to a user action - you can call it some time after your app starts (Though keep in mind the way the dialog is presented on iOS might be inconvenient to users if they didn't ask for it) or when suitable.

Use createAccount if signIn resolved with NoSavedCredentialFound result, as indicated in the code snippet above.

UI screenshots
await GoogleOneTapSignIn.createAccount();

presentExplicitSignIn
signature: (params?: OneTapExplicitSignInParams) => Promise<OneTapExplicitSignInResponse>

Platform	Behavior
Android	Presents the sign in dialog explicitly. This is useful if both signIn and createAccount resolve with NoSavedCredentialFound object - which happens (in the unlikely case) when no Google account is present on the device. This prompts the user to add a Google account.
Apple	Starts an interactive sign-in flow. Same as createAccount.
Web	Presents a one-tap prompt. Same as createAccount.
Preferably, call this method only as a reaction to when user taps a sign in button.

UI screenshots
await GoogleOneTapSignIn.presentExplicitSignIn();

checkPlayServices
signature: (showErrorResolutionDialog?: boolean): Promise<PlayServicesInfo>

The behavior of checkPlayServices varies across platforms:

Android: The function resolves if the device has Play Services installed and their version is >= the minimum required version. Otherwise, it rejects with statusCodes.PLAY_SERVICES_NOT_AVAILABLE error code, and more information in userInfo field (see below).
The showErrorResolutionDialog parameter (default true) controls whether a dialog that helps to resolve an error is shown (only in case the error is user-resolvable).

On Android, the presence of up-to-date Google Play Services is required to call any of the provided authentication and authorization methods. It is therefore necessary to call checkPlayServices any time prior to calling the authentication / authorization methods and only call those if checkPlayServices is successful.

Some errors are user-resolvable (e.g. when Play Services are outdated or disabled) while other errors cannot be resolved (e.g. when the phone doesn't ship Play Services at all - which is the case with some device vendors).

Dialog screenshots
Apple: Play Services are an Android-only concept and are not needed on Apple. Hence, the method always resolves.
Web: resolves when the Google Client Library is loaded, rejects otherwise.
Example of checkPlayServices() method
await GoogleOneTapSignIn.checkPlayServices();

signOut
signature: () => Promise<null>

Signs out the current user. This disables the automatic sign-in.

Returns a Promise that resolves with null or rejects in case of error.

await GoogleOneTapSignIn.signOut();

revokeAccess
signature: (emailOrUniqueId: string) => Promise<null>

Revokes access given to the current application and signs the user out. Use when a user deletes their account in your app. On the web, you need to provide the id or email of the user. On Android and Apple, the emailOrUniqueId parameter does not have any effect.

Returns a Promise that resolves with null or rejects in case of error.

await GoogleOneTapSignIn.revokeAccess(user.id);

requestAuthorization
signature: (params: RequestAuthorizationParams) => Promise<AuthorizationResponse>

The underlying Android SDK separates authentication and authorization - that means that on Android you can request an access token and call Google APIs on behalf of the user without previously signing the user in.

This method is used to request extra authorization from the user. Use this on Android to obtain server-side access (offline access) to the user's data or for requesting an access token that has access to additional scopes.

Platform	Behavior
Android	Presents a modal that asks user for additional access to their Google account. Uses AuthorizationRequest.Builder.
Apple	Calls addScopes. The resulting accessToken has access to the requested scopes. Use this if you want to read more user metadata than just the basic info.
Web	Not implemented at the moment.
UI screenshots
clearCachedAccessToken
signature: (accessTokenString: string) => Promise<null>

This method is only needed on Android. You may run into a 401 Unauthorized error when an access token is invalid. Call this method to remove the token from local cache and then call requestAuthorization() to get a fresh access token. Calling this method on Apple does nothing and always resolves. This is because on Apple, requestAuthorization() always returns valid tokens, refreshing them first if they have expired or are about to expire (see docs).

Automatic webClientId & iosClientId detection
If you use Expo (with the config plugin and prebuild), or if you're using Firebase, you don't need to provide the iosClientId parameter to the configure method.

Additionally, this module can automatically detect the webClientId from Firebase's configuration file (does not work on web where you need to provide it explicitly).

This is useful if you're using Firebase and want to avoid manually setting the webClientId in your code, especially if you have multiple environments (e.g. staging, production).

To use this feature:

Add WEB_CLIENT_ID entry to the GoogleService-Info.plist file.
On Android, the google-services.json file already contains the web client ID information. Unfortunately, it's not the case on iOS, so we need to add it ourselves.

Open the GoogleService-Info.plist in your favorite text editor and add the following:

<key>WEB_CLIENT_ID</key>
<string>your-web-client-id.apps.googleusercontent.com</string>

pass "autoDetect" as the webClientId parameter.
tip
As explained above, iosClientId can also be detected automatically - simply do not pass any iosClientId value. The reason webClientId is a required parameter is API uniformity across all platforms.

Web support

