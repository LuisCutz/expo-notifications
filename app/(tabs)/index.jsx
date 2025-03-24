import { useState, useEffect, useRef } from 'react';
import { Text, View, Button, Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Identificador único para la notificación
const NOTIFICATION_ID = 'pizza-notification';

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState([]);
  const [notification, setNotification] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync().then(value => setChannels(value ?? []));
    }

    if (!notificationListener.current) {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });
    }

    if (!responseListener.current) {
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log(response);
      });
    }

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
        notificationListener.current = null;
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
        responseListener.current = null;
      }
    };
  }, []);

  const handleScheduleNotification = async () => {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: "¡Ya llegaron las pipshas! 🍕",
          body: 'Pizza pizza 🍕',
          data: { data: 'goes here', test: { test1: 'more data' } },
          sound: 'default',
        },
        trigger: { 
          repeats: false
        }
      });

      Alert.alert('Notificación enviada exitosamente.');
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      Alert.alert('Error', 'No se pudo enviar la notificación: ' + error.message);
    }
    
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: 20,
      }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Tu Expo Push Token:</Text>
      <Text style={{ textAlign: 'center' }}>{expoPushToken}</Text>

      <Text>Canales: {JSON.stringify(channels.map(c => c.id), null, 2)}</Text>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontWeight: 'bold' }}>Última notificación recibida:</Text>
        <Text>Título: {notification?.request?.content?.title || ''}</Text>
        <Text>Mensaje: {notification?.request?.content?.body || ''}</Text>
        <Text>Datos: {notification ? JSON.stringify(notification.request.content.data) : ''}</Text>
      </View>

      <Button
        title="📤 Enviar notificación"
        onPress={handleScheduleNotification}
      />
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('myNotificationChannel', {
      name: 'Canal de notificaciones',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permiso denegado', 'No se obtuvo permiso para notificaciones push.');
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('No se encontró el Project ID');
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Push Token:', token);
    } catch (e) {
      console.error(e);
      token = `${e}`;
    }
  } else {
    Alert.alert('Solo funciona en dispositivo físico', 'Las notificaciones push no funcionan en emulador.');
  }

  return token;
}