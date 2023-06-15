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
import { memo }      from 'react';
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
	Dimensions,
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
	faTrash,
	faCalendar,
	faHouse,
	faCircleDot,
	faFloppyDisk,
} from '@fortawesome/free-solid-svg-icons';

// Other community libs.
//
// https://www.npmjs.com/package/react-native-drop-shadow
import SplashScreen   from 'react-native-splash-screen';
/*
import {
	LineChart,
	BarChart,
	PieChart,
	ProgressChart,
	ContributionGraph,
	StackedBarChart
}                     from "react-native-chart-kit";
*/

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
import SaveModal    from './components/SaveModal';

// Constants.
//
const minHistoryBarWidth = 65;
const historyWidthOffset = 25;

// The Distans App.
//
const App: () => Node = () => {

	const secondsSinceEpoch = Math.round(Date.now() / 1000);
	const [startTimeS, setStartTimeS]           = useState(secondsSinceEpoch);
	const [timeTaken, setTimeTaken]             = useState(0);
	const [units, setUnits]                     = useState('miles');
	const [action, setAction]                   = useState('stop');
	const [intervalId, setIntervalId]           = useState(0);
	const [currentLocation, setCurrentLocation] = useState(null);
	const [trackDistance, setTrackDistance]     = useState("0.00");
	const [speed, setSpeed]                     = useState('');
	const [history, setHistory]                 = useState ([]);
	const [showSaveModal, setShowSaveModal]     = useState (false);
	const [comment, setComment]                 = useState('');
	const [historyPage, setHistoryPage]         = useState(false);
	const [settingsPage, setSettingsPage]       = useState(false);

	const trackRef                              = useRef([]);
	const watchId                               = useRef();
	const pageRef                               = useRef();
	const scrollRef                             = useRef();

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

			// When the phone is off and the App is running the timer seems to stop, so get the 
			// timeTaken from date differences.
			//
			const secondsSinceEpoch = Math.round(Date.now() / 1000);
			const secondsElapsed    = secondsSinceEpoch - startTimeS;
			setTimeTaken (secondsElapsed);
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
		let meters = 0;
		for (let i=1; i < trackRef.current.length; i++) {
			meters += pointsDistance (trackRef.current[i - 1], trackRef.current [i]);
		}
		if (units === 'miles') {
			return meters / 1609.34;
		} else {
			return meters / 1000.00;
		}
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
				setTrackDistance (thisTrackDistance.toFixed (5));
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
		speed         = 3600 * (trackDistance / timeTaken );
		let speedText = `Speed : ${speed.toFixed (5)} ${units.charAt(0)}ph`;
		setSpeed (speedText);
		return speedText;
	}
	function onStartPress  () {
		setAction          ('start');
		setTrackDistance   ("0.00000");
		trackRef.current = [];
		getCurrentLocation ();
		const secondsSinceEpoch = Math.round(Date.now() / 1000);
		setStartTimeS      (secondsSinceEpoch);
		setTimeTaken       (0);
		getLocationUpdates ();
	}
	function onStopPress () {
		setAction('stop');
		stopLocationUpdates();
		trackDistance > 0.0 && setShowSaveModal(true);
	}
	async function saveTrack (comment) {
		let thisSpeed      = calculateSpeed();
		let currentHistory = history.slice();
		let thisTrack = {
			date      : new Date().toLocaleString('en-GB', { timeZone: 'UTC' }),
			distance  : trackDistance,
			time      : timeTaken,
			units     : units,
			speed     : thisSpeed,
			comment   : comment,
		};
		if (trackDistance > 0.0) {
			await addTrack (thisTrack);
			currentHistory.push (thisTrack);
			setHistory (currentHistory);
		}
	}

	// Bar chart calcs - using flexbox to draw one to my design, other graph libs aren't
	// very flexible.
	//
	function getBarHeights (track) {
		let maxDistance = 0.00;
		history.forEach ((track, index) => {
			if (maxDistance < track.distance) maxDistance = track.distance;
		});
		if (maxDistance > 0.0) {
			const barChartHeight = 100;
			const whiteHeight    = barChartHeight - (barChartHeight * (track.distance / maxDistance))
			const colourHeight   = barChartHeight * (track.distance / maxDistance)
			return ({whiteHeight : whiteHeight, colourHeight : colourHeight});
		} else {
			return ({whiteHeight : 1, colourHeight : 1});
		}
	}
	function getBarWidth () {
		if (history.length > 0) {
			let width = (Dimensions.get('window').width / history.length);
			if (width > minHistoryBarWidth) width = minHistoryBarWidth;
			return width;
		} else {
			return minHistoryBarWidth;
		}
	}
	function getBarChartWidth () {
		if (history.length > 0) {
			let width = Dimensions.get('window').width - historyWidthOffset;
			if (history.length > (Dimensions.get('window').width / minHistoryBarWidth)) {
				width = history.length * minHistoryBarWidth;
			}
			return width;
		} else {
			return Dimensions.get('window').width - historyWidthOffset;
		}
	}
	function scrollToEnd () {
		if (action === 'stop') {
			scrollRef.current.scrollToEnd({ animated: true });
		}
	}
	function HistoryBarChart () {
		return (
			<>
			<Text style={styles.bigText}>History</Text>
			<ScrollView
				ref={scrollRef}
				horizontal={true}
				persistentScrollbar={true}
				onContentSizeChange={() => scrollToEnd()}
			>
				<View style={{
					flex          : 1,
					flexDirection : 'row',
					borderWidth   : 1,
					borderRadius  : 5,
					borderColor   : "#d018ec",
					padding       : 5,
					width         : getBarChartWidth (),
				}}>
					{history.map ((track, index) => (
						<View key={index} style={{flex : 1, alignSelf : 'flex-start'}}>
							<Text style={{fontSize : 10}}>
								{track.comment || 'Untitled'} : {track.distance} : {track.speed} : {track.time} seconds
							</Text>
							<View style={{
								backgroundColor : 'white',
								width           : getBarWidth (),
								height          : getBarHeights(track).whiteHeight,
							}}>
							</View>
							<View style={{
								backgroundColor : '#d018ec',
								width           : getBarWidth (),
								height          : getBarHeights(track).colourHeight,
							}}>
							</View>
							<Text style={{fontSize : 10}}>{track.date}</Text>
						</View>
					))}
				</View>
			</ScrollView>
			</>
		);
	}
	async function clearHistory () {
		await clearTracks();
		setHistory ([]);
	}
	function showHistoryPage () {
		setHistoryPage(true);
		setSettingsPage(false);
	}
	function showMainPage () {
		setHistoryPage(false);
		setSettingsPage(false);
	}
	function showSettingsPage () {
		setSettingsPage(true);
		setHistoryPage(false);
	}
	function Header ({ page }) {
		return (
			<View style={[styles.spaceBetween, styles.greenBox]}>
				<Image
					source={require ("./src/assets/images/distans-icon.png")}
					style={styles.logoImage}
				/>
				<Text style={styles.title}>
					DistanS
				</Text>
				{page.match(/main|history/) &&
				<TouchableOpacity
					onPress={() => showSettingsPage ()}
				>
					<FontAwesomeIcon  color={'#d018ec'} size={35} icon={faGear} />
				</TouchableOpacity>
				}
				{page.match(/main|settings/) &&
				<TouchableOpacity
					onPress={() => showHistoryPage ()}
				>
					<FontAwesomeIcon  color={'#d018ec'} size={35} icon={faCalendar} />
				</TouchableOpacity>
				}
				{page.match(/history|settings/) &&
				<TouchableOpacity
					onPress={() => showMainPage ()}
				>
					<FontAwesomeIcon  color={'#d018ec'} size={35} icon={faHouse} />
				</TouchableOpacity>
				}
			</View>
		);
	}

	function MainPage () {
		return (
			<>
			<Header page={'main'}/>
			{action === 'stop' && <View>
				<TouchableOpacity
					disabled={action === 'start'}
					style={action === 'start' ? styles.buttonInactive : styles.button}
					onPress={() => onStartPress()}
				>
					<Text style={styles.buttonText}>Start</Text>
				</TouchableOpacity>
			</View>}
			{action === 'start' && <View>
				<TouchableOpacity
					disabled={action === 'stop'}
					style={action === 'stop' ? styles.buttonInactive : styles.button}
					onPress={() => onStopPress()}
				>
					<Text style={styles.buttonText}>Stop</Text>
				</TouchableOpacity>
			</View>}
			<View style={styles.centeredView}>
				<Text style={styles.title}>{trackDistance} {units}</Text>
				<Text style={styles.title}>
					{new Date(timeTaken * 1000).toISOString().slice(11, 19)}
				</Text>
				<Text style={styles.medText}>Lat  : {currentLocation?.coords?.latitude  || "computing ..."}</Text>
				<Text style={styles.medText}>Long : {currentLocation?.coords?.longitude || "computing ..."}</Text>
				<Text style={styles.medText}>{action === 'stop' ? speed : ''}</Text>
			</View>
			{showSaveModal && <SaveModal
				setShowSaveModal={setShowSaveModal}
				saveTrack={saveTrack}
			/>}
			</>
		)
	}
	function HistoryPage () {
		return (
			<>
			<Header page={'history'} />
			<HistoryBarChart />
			<TouchableOpacity
				onPress={() => clearHistory ()}
			>
				<FontAwesomeIcon  color={'#d018ec'} size={35} icon={faTrash} />
				<Text>Clear History</Text>
			</TouchableOpacity>
			</>
		);
	}
	function SettingsPage () {
		const [selected, setSelected] = useState (units);
		function saveUnits () {
			setUnits(selected);
			showMainPage ();
		}
		return (
			<>
			<Header page={'settings'} />
			<View style={{marginTop : '33%', flex : 1, justifyContent : 'space-around', alignItems : 'center', flexDirection : 'row'}}>
				<TouchableOpacity
					onPress={() => setSelected('miles')}
				>
					<FontAwesomeIcon 
						style={{alignSelf : 'center'}}
						color={selected === 'miles' ? '#d018ec' : 'dimgray'}
						size={50}
						icon={faCircleDot}
					/>
					<Text>Miles</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => setSelected('km')}
				>
					<FontAwesomeIcon
						style={{alignSelf : 'center'}}
						color={selected === 'km' ? '#d018ec' : 'dimgray'}
						size={50}
						icon={faCircleDot}
					/>
					<Text>Kilometers</Text>
				</TouchableOpacity>
			</View>
			<View
				style={{marginTop : '33%'}}
			>
				<TouchableOpacity
					style={styles.button}
					onPress={() => saveUnits()}
				>
					<Text style={styles.buttonText}>Save</Text>
				</TouchableOpacity>
			</View>
			</>
		);
	}

	// See ~/BUILD/tracksr/src/App.tsx for what I did before and c/w
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
				{historyPage ? (
					<HistoryPage />
				) : (
					settingsPage ? (
						<SettingsPage />
					) : (
						<MainPage />
					)
				)}
			</ScrollView>
		</SafeAreaView>
	);
};
export default App;
