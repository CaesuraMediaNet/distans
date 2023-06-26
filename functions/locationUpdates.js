/**
 * Location update functions.
 *
 * @format
 * @flow strict-local
 */

import React from 'react';

import { useState }  from 'react';
import { useEffect } from 'react';
import { useRef }    from 'react';

import {
	Platform,
	PermissionsAndroid,
	ToastAndroid,
}                          from 'react-native';

import VIForegroundService          from "@voximplant/react-native-foreground-service";
import Geolocation, { GeoPosition } from "react-native-geolocation-service";
import { getPreciseDistance }       from "geolib";


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


export async function hasLocationPermission ({ setNoPermissions }) {
	if (Platform.Version < 23) {
		setNoPermissions(false);
		return true;
	}
	const hasPermission = await PermissionsAndroid.check(
		PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
	);
	if (hasPermission) {
		setNoPermissions(false);
		return true;
	}

	const status = await PermissionsAndroid.request(
		PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
	);
	if (status === PermissionsAndroid.RESULTS.GRANTED) {
		setNoPermissions(false);
		return true;
	}

	if (status === PermissionsAndroid.RESULTS.DENIED) {
		ToastAndroid.show("Location permission denied by user.", ToastAndroid.SHORT);
	} else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
		ToastAndroid.show( "Location permission revoked by user.", ToastAndroid.SHORT);
	}
	setNoPermissions(true);
	return false;
}


export function stopLocationUpdates ({ watchId }) {
	VIForegroundService.getInstance()
		.stopService()
		.catch((err) => console.log("VIForegroundService.getInstance error : ", err));

	if (watchId.current !== null) {
		Geolocation.clearWatch(watchId.current);
		watchId.current = null;
	}
}

export const startForegroundService = async () => {
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

export function pointsDistance (point1, point2) {
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
	return metres;
}

export async function getLocationUpdates ({ watchId, setCurrentLocation, trackDistanceRef, position1Ref }) {
	const hasPermission = await hasLocationPermission();
	if (!hasPermission)  return;

	await startForegroundService();

	watchId.current = Geolocation.watchPosition(
		(position2) => {

			// console.log ("Geolocation.watchPosition : ", position2)
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
