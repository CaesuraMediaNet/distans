import AsyncStorage from '@react-native-async-storage/async-storage';
export async function addTrack (track) {
   try {
      let tracks = await getTracks ();
      tracks.push (track);
      await AsyncStorage.setItem('@storage_Key', JSON.stringify(tracks))
      return tracks;
   } catch (err) {
      return [];
   }
}
export async function getTracks () {
   try {
      let tracks = await AsyncStorage.getItem('@storage_Key')
      if (!tracks?.length) {
         tracks = [];
      } else {
         tracks = JSON.parse (tracks);
      }
      return tracks;
   } catch (err) {
      return [];
   }
}
export async function clearTracks () {
   try {
      await AsyncStorage.setItem('@storage_Key', JSON.stringify([]))
   } catch (err) {
   }
   return [];
}
