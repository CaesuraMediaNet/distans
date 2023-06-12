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
import {
	addTrack,
	getTracks,
	clearTracks,
}                   from './functions/savedTracks';

// The Distans App.
//
const App: () => Node = () => {

	const [showSettings, setShowSettings]       = useState(false);
	const [timeTaken, setTimeTaken]             = useState(0);
	const [units, setUnits]                     = useState('cm');
	const [action, setAction]                   = useState('stop');
	const [intervalId, setIntervalId]           = useState(0);
	const [currentLocation, setCurrentLocation] = useState(null);
	const [trackDistance, setTrackDistance]     = useState("0.00");
	const [speed, setSpeed]                     = useState('');
	const [history, setHistory]                 = useState ([]);

	// Tracks are updated within a 
	const trackRef                              = useRef([]);
	const watchId                               = useRef();
	const pageRef                               = useRef();

	const geoConfig = {
		acuracy : {
			android          : "high",
			ios              : "best",
		},
		enableHighAccuracy   : true,
		timeout              : 15000,
		maximumAge           : 10000,
		distanceFilter       : 0,
		forceRequestLocation : true,
		forceLocationManager : false,
		showLocationDialog   : true,
	};

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
			let currentHistory = await getTracks ();
			setHistory (currentHistory);
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

	function pointsDistance (point1, point2) {
		let metres = getPreciseDistance(
			{ latitude: point1.coords.latitude, longitude: point1.coords.longitude },
			{ latitude: point2.coords.latitude, longitude: point2.coords.longitude },
			0.1
		);
		return metres;
	}

	function getDistanceFromTrack () {
		let distance = 0;
		for (let i=1; i < trackRef.current.length; i++) {
			distance += pointsDistance (trackRef.current[i - 1], trackRef.current [i]);
		}
		return distance;
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
				setCurrentLocation (position);
			},
			(error) => {
				console.log ("Geolocation.getCurrentPosition : error : ", error);
			},
			geoConfig
		);
	}

	async function getLocationUpdates () {
		const hasPermission = await hasLocationPermission();
		if (!hasPermission) return;

		await startForegroundService();

		watchId.current = Geolocation.watchPosition(
			(position) => {

				setCurrentLocation (position);
				let currentTrack = trackRef.current.slice();
				currentTrack.push (position);

				// Update the track ref not the state, as the state is closed when entering this
				// function, and we need it to keep being updated depending on previous values.
				// Other states are fine to set here, as they only have one value.
				//
				// https://stackoverflow.com/questions/62806541/how-to-solve-the-react-hook-closure-issue
				//
				trackRef.current = currentTrack;

				let thisTrackDistance = getDistanceFromTrack (currentTrack);
				if (thisTrackDistance < 1) {
					thisTrackDistance = thisTrackDistance * 100;
					setUnits ('cm');
				} else if (thisTrackDistance > 1 && thisTrackDistance < 1609.34) {
					setUnits ('meters');
				} else {
					thisTrackDistance = thisTrackDistance / 1609.34;
					setUnits ('miles');
				}
				setTrackDistance (thisTrackDistance.toFixed (2));
			},
			(error) => {
				console.log ("Geolocation.watchPosition : error : ", error);
			},
			geoConfig
		);
	}

	const startForegroundService = async () => {
		if (Platform.Version >= 26) {
			await VIForegroundService.getInstance().createNotificationChannel({
				id              : "locationChannel",
				name            : "Location Tracking Channel",
				description     : "Tracks location of user",
				enableVibration : false,
			});
		}
		return VIForegroundService.getInstance().startService({
			channelId : "locationChannel",
			id        : 420,
			title     : "Distans",
			text      : "Tracking location updates",
			icon      : "ic_launcher",
		});
	};

	function calculateSpeed () {
		let speed     = '';
		let speedText = 'calculating...';
		if (units === "cm") {
			speed     = trackDistance / timeTaken;          // cm/s
			speedText = `Speed : ${speed.toFixed (2)} cm/second`;
		} else if (units === 'meters') {
			speed     = trackDistance / timeTaken;          // m/s
			speedText = `Speed : ${speed.toFixed (2)} meters/second`;
		} else {
			speed     = trackDistance / (timeTaken * 3600);   // mph;
			speedText = `Speed : ${speed.toFixed (2)} mph`;
		}
		setSpeed (speedText);
		return speedText;
	}
	function onStartPress  () {
		setAction          ('start');
		setTrackDistance   ("0.00");
		setUnits           ('cm');
		trackRef.current = [];
		getCurrentLocation ();
		setTimeTaken       (0);
		getLocationUpdates ();
	}
	async function onStopPress () {
		setAction ('stop');
		stopLocationUpdates ();
		let thisSpeed = calculateSpeed ();
		let currentHistory = history.slice();
		let thisTrack = {
			date      : new Date().toLocaleString('en-GB', { timeZone: 'UTC' }),
			distance  : trackDistance,
			time      : timeTaken,
			units     : units,
			speed     : thisSpeed,
		};
		await addTrack (thisTrack);

		currentHistory.push (thisTrack);
		setHistory (currentHistory);
	}

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
						disabled={action === 'start'}
						style={action === 'start' ? styles.buttonInactive : styles.button}
						onPress={() => onStartPress()}
					>
						<Text style={styles.buttonText}>Start</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.centeredView}>
					<Text style={styles.title}>{trackDistance} {units}</Text>
					<Text style={styles.title}>
						{new Date(timeTaken * 1000).toISOString().slice(11, 19)}
					</Text>
					<Text style={styles.medText}>Lat  : {currentLocation?.coords?.latitude  || "computing ..."}</Text>
					<Text style={styles.medText}>Long : {currentLocation?.coords?.longitude || "computing ..."}</Text>
					<Text style={styles.medText}>{action === 'stop' ? speed : ''}</Text>
				</View>
				<View>
					<TouchableOpacity
						disabled={action === 'stop'}
						style={action === 'stop' ? styles.buttonInactive : styles.button}
						onPress={() => onStopPress()}
					>
						<Text style={styles.buttonText}>Stop</Text>
					</TouchableOpacity>
				</View>
				{history.map ((track, index) => (
					<Text key={index} style={styles.medText}>
						{track.date} :  {track.distance} {track.units} : {track.time} seconds : {track.speed}
					</Text>
				))}
			</ScrollView>
		</SafeAreaView>
  );
};
export default App;
