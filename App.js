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

// Local Components.
//
import styles       from './styles';

// Local functions.
//

// The Distans App.
//
const App: () => Node = () => {

	const [showSettings, setShowSettings] = useState (false);
	const [distance, setDistance]         = useState (0);
	const [timeTaken, setTimeTaken]       = useState (0);
	const [units, setUnits]               = useState ('miles');
	const [action, setAction]             = useState ('stop');
	const [intervalId, setIntervalId]     = useState ('stop');
	const pageRef = useRef();

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

	function showSettingsPage () {
		setShowSettings (true);
	}

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
