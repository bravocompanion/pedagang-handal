import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, BackHandler, Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { StatusBar } from 'expo-status-bar';
import { APP_HTML } from './src/appHtml';

const SESSION_KEY = 'pedagang-handal-auth-v1';
const LEGACY_DATA_KEY = 'hpp-master-v1';
const DATA_PREFIX = 'pedagang-handal-user-v1:';
const AUTH_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  resetPasswordUrl: process.env.EXPO_PUBLIC_PASSWORD_RESET_URL || '',
};
// Only Supabase publishable credentials are permitted in the client.
const CONFIG_SCRIPT = '<script>window.PEDAGANG_CONFIG=' +
  JSON.stringify(AUTH_CONFIG).replace(/</g, '\\u003c') + ';</script>';
const MOBILE_HTML = APP_HTML.replace('<script src="./config.js"></script>', CONFIG_SCRIPT);

type Message = { type: string; uid?: string; payload?: string; seq?: number; html?: string };
const validUid = (v: unknown): v is string =>
  typeof v === 'string' &&
  (v === 'demo-local' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v));
const dataKey = (uid: string) => uid === 'demo-local' ? LEGACY_DATA_KEY : DATA_PREFIX + uid;

export default function App() {
  const web = useRef<WebView>(null);
  const activeUser = useRef<string | null>(null);
  const authWork = useRef<Promise<void>>(Promise.resolve());
  const writeWork = useRef<Promise<void>>(Promise.resolve());

  const send = useCallback((value: object) => {
    const serialized = JSON.stringify(JSON.stringify(value));
    web.current?.injectJavaScript(
      "window.dispatchEvent(new MessageEvent('message',{data:" + serialized + "})); true;"
    );
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      web.current?.injectJavaScript(
        "if(!window.pedagangBack?.()){window.ReactNativeWebView.postMessage(JSON.stringify({type:'AT_HOME_BACK'}));} true;"
      );
      return true;
    });
    return () => subscription.remove();
  }, []);

  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    let msg: Message;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (!msg || typeof msg.type !== 'string') return;
    try {
      switch (msg.type) {
        case 'READY': {
          const payload = await SecureStore.getItemAsync(SESSION_KEY);
          send({type:'AUTH_SESSION', payload});
          break;
        }
        case 'AUTH_STORE': {
          authWork.current = (async () => {
            const session = JSON.parse(msg.payload || 'null');
            if (!validUid(session?.user?.id) || session.user.id === 'demo-local' ||
                !session?.access_token || !session?.refresh_token || !AUTH_CONFIG.url) {
              throw new Error('Sesi Supabase tidak valid.');
            }
            const res = await fetch(AUTH_CONFIG.url.replace(/\/$/, '') + '/auth/v1/user', {
              headers: {
                apikey: AUTH_CONFIG.publishableKey,
                Authorization: 'Bearer ' + session.access_token
              }
            });
            if (!res.ok) throw new Error('Token sesi gagal diverifikasi.');
            const user = await res.json();
            if (user?.id !== session.user.id) throw new Error('Identitas akun tidak cocok.');
            await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              user: {
                id: user.id,
                email: String(user.email || '').slice(0, 254),
                user_metadata: { full_name: String(user.user_metadata?.full_name || '').slice(0, 80) }
              }
            }));
            activeUser.current = user.id;
          })();
          await authWork.current;
          break;
        }
        case 'AUTH_CLEAR':
          await authWork.current.catch(() => undefined);
          activeUser.current = null;
          await SecureStore.deleteItemAsync(SESSION_KEY);
          break;
        case 'LOAD_USER': {
          await authWork.current;
          if (!validUid(msg.uid)) throw new Error('ID akun tidak valid.');
          if (msg.uid !== 'demo-local' && activeUser.current !== msg.uid) {
            const payload = await SecureStore.getItemAsync(SESSION_KEY);
            const stored = payload ? JSON.parse(payload) : null;
            if (!stored?.refresh_token || stored?.user?.id !== msg.uid) {
              throw new Error('Tidak ada sesi terverifikasi untuk akun ini.');
            }
            activeUser.current = msg.uid;
          }
          await writeWork.current;
          send({type:'DATA', uid:msg.uid, payload:await AsyncStorage.getItem(dataKey(msg.uid))});
          break;
        }
        case 'SAVE': {
          await authWork.current;
          if (!validUid(msg.uid) || (msg.uid !== 'demo-local' && activeUser.current !== msg.uid)) {
            throw new Error('Penyimpanan akun tidak diizinkan.');
          }
          if (typeof msg.payload !== 'string' || msg.payload.length > 6_000_000) {
            throw new Error('Data lokal tidak valid atau terlalu besar.');
          }
          const uid = msg.uid;
          const payload = msg.payload;
          writeWork.current = writeWork.current.catch(() => undefined)
            .then(() => AsyncStorage.setItem(dataKey(uid), payload));
          await writeWork.current;
          send({type:'SAVE_RESULT', uid, seq:msg.seq, ok:true});
          break;
        }
        case 'EXPORT_PDF': {
          if (typeof msg.html !== 'string' || msg.html.length > 2_000_000) {
            throw new Error('Dokumen PDF tidak valid.');
          }
          const printed = await Print.printToFileAsync({html:msg.html});
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(printed.uri, {
              mimeType:'application/pdf',
              UTI:'com.adobe.pdf',
              dialogTitle:'Bagikan laporan Pedagang Handal'
            });
          } else Alert.alert('PDF berhasil dibuat', printed.uri);
          break;
        }
        case 'EXPORT_BACKUP': {
          if (typeof msg.payload !== 'string' || msg.payload.length > 6_000_000) {
            throw new Error('Cadangan terlalu besar.');
          }
          const uri = String(FileSystem.cacheDirectory) + 'Pedagang-Handal-Cadangan.json';
          await FileSystem.writeAsStringAsync(uri, msg.payload);
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType:'application/json',
              UTI:'public.json',
              dialogTitle:'Simpan cadangan Pedagang Handal'
            });
          } else Alert.alert('Cadangan berhasil dibuat', uri);
          break;
        }
        case 'AT_HOME_BACK':
          Alert.alert('Keluar Pedagang Handal?', 'Pastikan sinkronisasi sudah selesai.', [
            {text:'Batal', style:'cancel'},
            {text:'Keluar', onPress:() => BackHandler.exitApp()}
          ]);
          break;
        default:
          break;
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Operasi gagal';
      if (msg.type === 'LOAD_USER') send({type:'DATA_ERROR', uid:msg.uid, error:reason});
      if (msg.type === 'SAVE') send({type:'SAVE_RESULT', uid:msg.uid, seq:msg.seq, ok:false, error:reason});
      Alert.alert('Operasi gagal', reason);
    }
  }, [send]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" backgroundColor="#F3F6F9"/>
      <View style={styles.container}>
        <WebView
          ref={web}
          source={{html:MOBILE_HTML}}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          bounces={false}
          setSupportMultipleWindows={false}
          onMessage={onMessage}
          showsVerticalScrollIndicator={false}
          style={styles.web}
          mixedContentMode="never"
          allowFileAccess={false}
          javaScriptCanOpenWindowsAutomatically={false}
          onShouldStartLoadWithRequest={(request) => request.url === 'about:blank'}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {flex:1,backgroundColor:'#F3F6F9',paddingTop:Platform.OS==='android' ? NativeStatusBar.currentHeight || 0 : 0},
  container: {flex:1},
  web: {flex:1,backgroundColor:'#F3F6F9'}
});
