/**
 * DistanS : Measure walking, riding etc distance, with records.
 *
 * @format
 * @flow strict-local
 */

import React from 'react';

import { useState }  from 'react';
import { useEffect } from 'react';
import { useRef }    from 'react';

import type {Node}   from 'react';
import {
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	useColorScheme,
	View,
	Button,
	FlatList,
	TouchableOpacity,
	Image,
	Platform,
	ToastAndroid,
	PermissionsAndroid,
} from 'react-native';

// FontAwesome.
//
import {
	Colors,
} from 'react-native/Libraries/NewAppScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
	faQuestion,
	faPlus,
	faMinus,
	faPlay,
	faGear,
} from '@fortawesome/free-solid-svg-icons';

// Other community libs.
//
// https://www.npmjs.com/package/react-native-drop-shadow
import SplashScreen   from 'react-native-splash-screen';

// GeoLoc et al.
//
import Geolocation, { GeoPosition } from "react-native-geolocation-service";
import VIForegroundService          from "@voximplant/react-native-foreground-service";
import AsyncStorage                 from "@react-native-async-storage/async-storage";
import { getPreciseDistance }       from "geolib";

// Local Components.
//
import styles       from './styles';

// Local functions.
//

// The Distans App.
//
const App: () => Node = () => {

	const [showSettings, setShowSettings]       = useState (false);
	const [distance, setDistance]               = useState (0);
	const [timeTaken, setTimeTaken]             = useState (0);
	const [units, setUnits]                     = useState ('miles');
	const [action, setAction]                   = useState ('stop');
	const [intervalId, setIntervalId]           = useState ('stop');
	const [currentLocation, setCurrentLocation] = useState (null);

	const watchId                         = useRef();
	const pageRef                         = useRef();

	useEffect(() => {
		console.log ("useEffect : action=", action);
		SplashScreen.hide();
		function updateTimer () {
			setTimeTaken ((setTimeTaken) => setTimeTaken + 1);
		}
		if (action === "stop") {
			clearInterval (intervalId);
		} else if (action === "start") {
			setTimeTaken (0);
			let thisIntervalId = setInterval (updateTimer, 1000);
			setIntervalId (thisIntervalId);
		}
		return () => clearInterval (intervalId);
	}, [action]);

	useEffect(() => {
		async function fetchData() {
			await getCurrentLocation();
		}
		fetchData();
		return () => {stopLocationUpdates()}
	}, []);

	function showSettingsPage () {
		setShowSettings (true);
	}

	function stopLocationUpdates () {
		VIForegroundService.getInstance()
			.stopService()
			.catch((err) => err);

		if (watchId.current !== null) {
			Geolocation.clearWatch(watchId.current);
			watchId.current = null;
		}
	}

	function pointsDistance ({point1, point2}) {
		let metres = getPreciseDistance(
			{ latitude: point1.coords.latitude, longitude: point1.coords.longitude },
			{ latitude: point2.coords.latitude, longitude: point2.coords.longitude },
			0.1
		);
		return metres / 1609.34;
	}

	async function hasLocationPermission () {
		if (Platform.Version < 23) {
			return true;
		}
		const hasPermission = await PermissionsAndroid.check(
			PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
		);
		if (hasPermission) return true;

		const status = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
		);
		if (status === PermissionsAndroid.RESULTS.GRANTED) {
		  return true;
		}

		if (status === PermissionsAndroid.RESULTS.DENIED) {
			ToastAndroid.show("Location permission denied by user.", ToastAndroid.LONG);
		} else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
			ToastAndroid.show( "Location permission revoked by user.", ToastAndroid.LONG);
		}
		return false;
	}

	async function getCurrentLocation () {
		const hasPermission = await hasLocationPermission();
		if (!hasPermission) return;

		Geolocation.getCurrentPosition(
			(position) => {
				console.log ("Geolocation.getCurrentPosition : ", position);
				setCurrentLocation (position);
			},
			(error) => {
				console.log ("Geolocation.getCurrentPosition : error : ", error);
			},
			{
				acuracy : {
					android : "high",
					ios     : "best",
				},
				enableHighAccuracy   : true,
				timeout              : 15000,
				maximumAge           : 10000,
				distanceFilter       : 0,
				forceRequestLocation : true,
				forceLocationManager : false,
				showLocationDialog   : true,
			}
		);
	}








	function trackLength ({track}) {
		let length = 0;
		for (let i = 1; i < track.length; i++) {
			length += pointsDistance(track[i - 1], track[i]);
		}
		return length;
	};







	// See /home/andyc/BUILD/tracksr/src/App.tsx for what I did before and c/w
	// https://dev-yakuza.posstree.com/en/react-native/react-native-geolocation-service/
	//
	return (
		<SafeAreaView style={styles.container}>
			<StatusBar />
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				keyboardShouldPersistTaps='handled'
				ref={pageRef}
			>
				<View style={[styles.spaceBetween, styles.greenBox]}>
					<Image
						source={require ("./src/assets/images/distans-icon.png")}
						style={styles.logoImage}
					/>
					<Text style={styles.title}>
						DistanS
					</Text>
					<TouchableOpacity
						onPress={() => showSettingsPage ()}
					>
						<FontAwesomeIcon  color={'dimgray'} size={35} icon={faGear} />
					</TouchableOpacity>
				</View>
				<View>
					<TouchableOpacity
						style={styles.button}
						onPress={() => setAction ('start')}
					>
						<Text style={styles.buttonText}>Start</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.centeredView}>
					<Text style={styles.title}>{distance} {units}</Text>
					<Text style={styles.title}>{timeTaken} seconds</Text>
					<Text style={styles.title}>Lat  : {currentLocation.coords.latitude} </Text>
					<Text style={styles.title}>Long : {currentLocation.coords.longitude} </Text>
				</View>
				<View>
					<TouchableOpacity
						style={styles.button}
						onPress={() => setAction ('stop')}
					>
						<Text style={styles.buttonText}>Stop</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
  );
};
export default App;
