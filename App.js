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
	BackHandler,
	ActivityIndicator,
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
const barChartHeight     = 100;
const minHistoryBarWidth = 65;
const historyWidthOffset = 25;
const showClearHistory   = true;
const distanceResolution = 5;

// The Distans App.
//
const App: () => Node = () => {

	const secondsSinceEpoch                       = Math.round(Date.now() / 1000);
	const [startTimeS, setStartTimeS]             = useState(secondsSinceEpoch);
	const [timeTaken, setTimeTaken]               = useState(0);
	const [units, setUnits]                       = useState('miles');
	const [action, setAction]                     = useState('stop');
	const [intervalId, setIntervalId]             = useState(0);
	const [currentLocation, setCurrentLocation]   = useState(null);
	const [speed, setSpeed]                       = useState('');
	const [history, setHistory]                   = useState ([]);
	const [showSaveModal, setShowSaveModal]       = useState (false);
	const [comment, setComment]                   = useState('');
	const [historyPage, setHistoryPage]           = useState(false);
	const [settingsPage, setSettingsPage]         = useState(false);
	const [timeOfPause, setTimeOfPause]           = useState(secondsSinceEpoch);
	const [pausedTime, setPausedTime]             = useState(0);

	const trackDistanceRef                        = useRef(0);
	const position1Ref                            = useRef({});
	const watchId                                 = useRef();
	const pageRef                                 = useRef();
	const scrollRef                               = useRef();

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
        forceLocationManager : Platform.Version >= 28, // true : use android's default LocationManager API 
        showLocationDialog   : true,
    };

	useEffect(() => {
		console.log ("useEffect : action=", action);
		console.log ("geoConfig : ", geoConfig);
		SplashScreen.hide();
		function updateTimer () {

			// When the phone is off and the App is running the timer seems to stop, so get the 
			// timeTaken from date differences.
			//
			const secondsSinceEpoch = Math.round(Date.now() / 1000);
			const secondsElapsed    = secondsSinceEpoch - startTimeS - pausedTime;
			setTimeTaken (secondsElapsed);
		}
		if (action === 'stop') {
			clearInterval(intervalId);
			setPausedTime(0);
		} else if (action === 'start') {
			setTimeTaken (0);
			let thisIntervalId = setInterval (updateTimer, 1000);
			setIntervalId(thisIntervalId);
		} else if (action === 'pause') {
			clearInterval(intervalId);
			setTimeOfPause(Math.round(Date.now() / 1000));
		} else if (action === 'restart') {
			let thisIntervalId = setInterval (updateTimer, 1000);
			setIntervalId (thisIntervalId);
		}
		return () => clearInterval (intervalId);
	}, [action]);

	useEffect(() => {
		trackDistanceRef.current = 0;
		async function fetchData() {
			await getCurrentLocation();
			let currentHistory = await getTracks ();
			setHistory (currentHistory);
		}
		fetchData();
		return () => {stopLocationUpdates()}
	}, []);

    // https://reactnative.dev/docs/backhandler
    //
    useEffect(() => {
        const backAction = () => {
			if (!historyPage && !settingsPage) {
				return false;
			}
			showMainPage();
            return true;
        };
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => backAction (),
        );
        return () => backHandler.remove();
    },[settingsPage, historyPage]);

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
		if (!( point1?.coords?.latitude
			&& point1?.coords?.longitude
			&& point2?.coords?.latitude
			&& point2?.coords?.longitude)) {
			return 0;
		}
		let metres = getPreciseDistance(
			{ latitude: point1.coords.latitude, longitude: point1.coords.longitude },
			{ latitude: point2.coords.latitude, longitude: point2.coords.longitude },
			0.1
		);
        if (units === 'miles') {
            return metres / 1609.34;
        } else {
            return metres / 1000.00;
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
				position1Ref.current = position;
			},
			(error) => {
				console.log ("Geolocation.getCurrentPosition : error : ", error);
			},
			geoConfig
		);
	}

	async function getLocationUpdates () {
		const hasPermission = await hasLocationPermission();
		if (!hasPermission)  return; 

		await startForegroundService();

		watchId.current = Geolocation.watchPosition(
			(position2) => {

				setCurrentLocation (position2);

				// Update the trackDistanceRef ref not a state, as the state is closed when entering this
				// function, and we need it to keep being updated depending on previous values.
				// Other states are fine to set here, as they only have one value.
				//
				// https://stackoverflow.com/questions/62806541/how-to-solve-the-react-hook-closure-issue
				//
				// Increment the track distance by the new one.
				//
				trackDistanceRef.current += pointsDistance (position1Ref.current, position2);

				// Now this is the first position for next update.
				//
				position1Ref.current = position2;
			},
			(error) => {
				console.log ("Geolocation.watchPosition error : ", error);
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
		speed         = 3600 * (trackDistanceRef.current / timeTaken );
		let speedText = `${speed.toFixed (distanceResolution)}${units.charAt(0)}ph`;
		setSpeed (speedText);
		return speedText;
	}
	function onStartPress          () {
		setAction                  ('start');
		trackDistanceRef.current = 0;
		getCurrentLocation         ();
		const secondsSinceEpoch  = Math.round(Date.now() / 1000);
		setStartTimeS              (secondsSinceEpoch);
		setTimeTaken               (0);
		getLocationUpdates         ();
	}
	function onPausePress () {
		setAction          ('pause');
		stopLocationUpdates();
	}
	function onReStartPress () {
		setAction          ('restart');
		getLocationUpdates ();

		// pausedTime increases on every pause, there maybe more than one pause in a journey/route/track.
		// pausedTime is the number of seconds the user pauses before restart which, initially 0, gets 
		// subtracted from the timeTaken in updateTimer above.
		//
		let now = Math.round(Date.now() / 1000);
		setPausedTime ((pausedTime) => pausedTime + now - timeOfPause);
	}
	function onStopPress () {
		setAction('stop');
		stopLocationUpdates();
		trackDistanceRef.current > 0.0 && setShowSaveModal(true);
	}
	async function saveTrack (comment) {

		// Don't save a track with no miles or km in.
		//
		if (trackDistanceRef.current > 0.0) {
			let thisSpeed      = calculateSpeed();
			let currentHistory = history.slice();

			let thisTrack = {
				date      : new Date().toLocaleString('en-GB', { timeZone: 'UTC' }),
				distance  : trackDistanceRef.current.toFixed(distanceResolution),
				time      : new Date(timeTaken * 1000).toISOString().slice(11, 19),
				units     : units,
				speed     : thisSpeed,
				comment   : comment,
			};
			await addTrack (thisTrack);
			currentHistory.push (thisTrack);
			setHistory (currentHistory);
		}
	}

	async function testTracks () {
		let currentHistory = history.slice();
		for (let i=0; i < 20; i++) {
			let thisTrack = {
                date      : new Date(new Date() - Math.random()*(1e+12)).toLocaleString('en-GB', { timeZone: 'UTC' }),
                distance  : i + 2,
                time      : new Date((i + 1) * 1000).toISOString().slice(11, 19),
                units     : units,
                speed     : 17.0,
                comment   : "Test Track " + i,
            };
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
		history.forEach ((thisTrack, index) => {
			if (maxDistance < parseFloat(thisTrack.distance)) maxDistance = parseFloat(thisTrack.distance);
		});
		if (maxDistance > 0.0) {
			const colourHeight   = barChartHeight * (track.distance / maxDistance)
			const whiteHeight    = barChartHeight - colourHeight;
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
			<Text style={styles.bigText}>All Journeys</Text>
			<ScrollView
				style={{marginTop : 10, marginBottom : 20}}
				ref={scrollRef}
				horizontal={true}
				persistentScrollbar={true}
				onContentSizeChange={() => scrollToEnd()}
			>
				<View style={[styles.historyContainer, {width : getBarChartWidth()}]}>
					{history.map ((track, index) => (
						<View key={index} style={styles.historyTrackBar}>
							<Text style={{fontSize : 10, fontWeight : 'bold'}}>
								 {track.comment || 'Untitled'} : 
							</Text>
							<Text style={{fontSize : 10}}>
								{track.distance}{units} : {track.speed} : {track.time} 
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
		if (action === 'stop') {
			setHistoryPage(true);
			setSettingsPage(false);
		}
	}
	function showMainPage () {
		setHistoryPage(false);
		setSettingsPage(false);
	}
	function showSettingsPage () {
		if (action === 'stop') {
			setSettingsPage(true);
			setHistoryPage(false);
		}
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
					<FontAwesomeIcon  color={action !== 'stop' ? 'dimgray' : '#d018ec'} size={35} icon={faGear} />
				</TouchableOpacity>
				}
				{page.match(/main|settings/) && history.length > 0 &&
				<TouchableOpacity
					onPress={() => showHistoryPage ()}
				>
					<FontAwesomeIcon  color={action !== 'stop' ? 'dimgray' : '#d018ec'} size={35} icon={faCalendar} />
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
			<View style={{
				borderWidth   : 1,
				borderRadius  : 5,
				borderColor   : "#d018ec",
				marginTop     : 10,
				marginBottom  : 10,
				paddingTop    : 10,
				paddingBottom : 10,
			}}>
				{!currentLocation?.coords?.latitude &&
					<View style={styles.centre}>
						<ActivityIndicator size="large" color="#d018ec" />
					</View>
				}
				{action === 'stop' && currentLocation?.coords?.latitude && <View>
					<TouchableOpacity
						style={styles.button}
						onPress={() => onStartPress()}
					>
						<Text style={styles.buttonText}>Start</Text>
					</TouchableOpacity>
				</View>}
				{action.match(/start|pause/) && <View>
					<TouchableOpacity
						style={styles.button}
						onPress={() => onStopPress()}
					>
						<Text style={styles.buttonText}>Stop</Text>
					</TouchableOpacity>
				</View>}
				<View style={styles.centeredView}>
					<Text style={styles.title}>
						{trackDistanceRef?.current?.toFixed(distanceResolution) || "0.0"} {units}
					</Text>
					<Text style={styles.title}>
						{new Date(timeTaken * 1000).toISOString().slice(11, 19)}
					</Text>
					<Text style={styles.medText}>Lat  : {currentLocation?.coords?.latitude  || "computing ..."}</Text>
					<Text style={styles.medText}>Long : {currentLocation?.coords?.longitude || "computing ..."}</Text>
					<Text style={styles.medText}>{action === 'stop' ? speed : ''}</Text>
				</View>
				{action.match(/start/) && <View>
					<TouchableOpacity
						style={styles.button}
						onPress={() => onPausePress()}
					>
						<Text style={styles.buttonText}>Pause</Text>
					</TouchableOpacity>
				</View>}
				{action === 'pause' && <View>
					<TouchableOpacity
						style={styles.button}
						onPress={() => onReStartPress()}
					>
						<Text style={styles.buttonText}>Restart</Text>
					</TouchableOpacity>
				</View>}
				{showSaveModal && <SaveModal
					setShowSaveModal={setShowSaveModal}
					saveTrack={saveTrack}
				/>}
			</View>
			</>
		)
	}
	function calculateAverages(hash) {
		let returnArray = [];
		for (const [title, tracks] of Object.entries(hash)) {
			let totalDistance = 0;
			let totalTime     = 0;
			tracks.forEach ((thisTrack, index) => {
				totalDistance += parseFloat(thisTrack.distance);

				// https://stackoverflow.com/questions/9640266/convert-hhmmss-string-to-seconds-only-in-javascript
				//
				let timeS     = thisTrack.time.split(':').reduce((acc,time) => (60 * acc) + +time);
				totalTime     += timeS;
			});
			let averageSpeed = totalDistance / totalTime;

			// Convert seconds back to HH:MM:SS
			//
			var date       = new Date(0);
			date.setSeconds(totalTime);
			var timeString = date.toISOString().substring(11, 19);

			returnArray.push({
				title         : title,
				averageSpeed  : averageSpeed.toFixed(distanceResolution),
				totalDistance : totalDistance.toFixed(distanceResolution),
				totalTime     : timeString,
				numTracks     : tracks.length,
			});
		}
		return returnArray;
	}
	function getStatsBarHeights(dataArray, item) {
		let maxDistance = 0.0;
		dataArray.forEach ((thisItem, index) => {
			if (maxDistance < parseFloat(thisItem.totalDistance)) {
				maxDistance = parseFloat(thisItem.totalDistance);
			}
		});
		if (maxDistance > 0.0) {
            const colourHeight   = barChartHeight * (item.totalDistance / maxDistance)
            const whiteHeight    = barChartHeight - colourHeight;
            return ({whiteHeight : whiteHeight, colourHeight : colourHeight});
		} else {
			return ({whiteHeight : 1, colourHeight : 1});
		}

	}
	function ShowStats ({dataArray}) {
		const thisScrollRef = useRef();
		let chartWidth = Dimensions.get('window').width - historyWidthOffset;
		if (dataArray.length > (Dimensions.get('window').width / minHistoryBarWidth)) {
			chartWidth = dataArray.length * minHistoryBarWidth;
		} 
		let barWidth = (Dimensions.get('window').width / dataArray.length);
		if (barWidth > minHistoryBarWidth) barWidth = minHistoryBarWidth;
		return (
			<ScrollView
                style={{marginTop : 10, marginBottom : 20}}
                ref={thisScrollRef}
                horizontal={true}
                persistentScrollbar={true}
                onContentSizeChange={() => thisScrollRef.current.scrollToEnd({ animated: true })}
            >
                <View style={[styles.historyContainer, {width : chartWidth}]}>
                    {dataArray.map ((data, index) => (
                        <View key={index} style={styles.historyTrackBar}>
							<Text style={{fontSize : 10}}>
                                 {data.numTracks} tracks : {data.totalDistance}{units} : {data.totalTime}
                            </Text>
							<View style={{
								backgroundColor : 'white',
								width           : barWidth,
								height          : getStatsBarHeights(dataArray, data).whiteHeight,
							}}>
							</View>
							<View style={{
								backgroundColor : '#d018ec',
								width           : barWidth,
								height          : getStatsBarHeights(dataArray, data).colourHeight,
							}}>
							</View>
							<Text style={{fontSize : 10}}>{data.title}</Text>
						</View>
					))}
				</View>
			</ScrollView>
		);
	}
	function HistoryStats () {
		let dayHash   = {};
		let weekHash  = {};
		let monthHash = {};
		let yearHash  = {};
		history.forEach ((thisTrack, index) => {

			// Tue Jun 20 16:03:59 2023
			//
			// Daily.
			//
			let day = thisTrack.date.replace (/\d\d:\d\d:\d\d /, ''); // Tue Jun 20 2023
			if (typeof dayHash[day] === "undefined") {
				dayHash[day] = [];
			}
			dayHash[day].push (thisTrack);

			// Weekly. By week number 1-52 and Year
			// https://www.geeksforgeeks.org/calculate-current-week-number-in-javascript/
			//
			let thisDate   = new Date(thisTrack.date);
			let startDate  = new Date(thisDate.getFullYear(), 0, 1);
			let days       = Math.floor((thisDate - startDate) / (24 * 60 * 60 * 1000));
			let weekNumber = Math.ceil(days / 7);
			let year       = thisDate.getFullYear();
			let hashKey    = "week#" + weekNumber + " " + year;
			if (typeof weekHash[hashKey] === "undefined") {
				weekHash[hashKey] = [];
			}
			weekHash[hashKey].push(thisTrack);

			// "Month Year"
			//
			let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			let month = months[thisDate.getMonth()];
			hashKey   = `${month} ${year}`;
			if (typeof monthHash[hashKey] === "undefined") {
				monthHash[hashKey] = [];
			}
			monthHash[hashKey].push (thisTrack);

			// Just year.
			//
			if (typeof yearHash[year]  === "undefined") {
				yearHash[year] = [];
			}
			yearHash[year].push (thisTrack);
			// console.log ("dayHash : ", dayHash);
			// console.log ("weekHash : ", weekHash);
			// console.log ("monthHash : ", monthHash);
			// console.log ("yearHash : ", yearHash);
		});
		let dayArray   = calculateAverages (dayHash);
		let weekArray  = calculateAverages (weekHash);
		let monthArray = calculateAverages (monthHash);
		let yearArray  = calculateAverages (yearHash);

		return (
			<View>
				<Text      key={'Daily'}    style={styles.bigText}>Daily</Text>
				<ShowStats key={'day'}      dataArray={dayArray} />
				<Text      key={'Weekly'}   style={styles.bigText}>Weekly</Text>
				<ShowStats key={'week'}     dataArray={weekArray} />
				<Text      key={'Monthly'}  style={styles.bigText}>Monthly</Text>
				<ShowStats key={'month'}    dataArray={monthArray} />
				<Text      key={'Annually'} style={styles.bigText}>Annually</Text>
				<ShowStats key={'year'}     dataArray={yearArray} />
			</View>
		);
	}
	function HistoryPage () {
		return (
			<>
			<TouchableOpacity
				style={styles.button}
				onPress={() => testTracks ()}
			>
				<Text style={styles.buttonText}>Generate Test Tracks</Text>
			</TouchableOpacity>
			<Header page={'history'} />
			{history.length === 0 &&
				<Text>No history recorded yet.</Text>
			}
			{history.length > 0 &&
				<>
				<HistoryBarChart />
				{showClearHistory &&
					<TouchableOpacity
						style={styles.button}
						onPress={() => clearHistory ()}
					>
						<Text style={styles.buttonText}>Clear History</Text>
					</TouchableOpacity>
				}
				<HistoryStats />
				</>
			}
			</>
		);
	}
	function SettingsPage () {
		const [selected, setSelected] = useState (units);
		function saveUnits () {
			setUnits(selected);
			showMainPage ();
			// AKJC HERE : change the display if stopped and showing distance and speed.
			ToastAndroid.show(`Units saved as ${selected}`, ToastAndroid.SHORT);
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
					<Text>Kilometres</Text>
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
