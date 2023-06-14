// https://reactnative.dev/docs/modal
//
import React, {useState} from 'react';
import {
	Alert,
	Text,
	TouchableOpacity,
	View,
	TextInput,
}              from 'react-native';
import styles  from '../styles';
import Modal   from "react-native-modal";

export default function SaveModal ({saveTrack, setShowSaveModal}) {
	const [comment, onChangeComment] = React.useState('');
	function saveTrackAndClose () {
		setShowSaveModal(false);
		saveTrack(comment);
	}
  return (
    <View>
      <Modal
		avoidKeyboard={true}
        isVisible={true}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalHeader}>Do you want to save this journey?</Text>
			<Text style={styles.medText}>Comments</Text>
			<TextInput
				style={styles.textInput}
				onChangeText={onChangeComment}
				value={comment}
			/>
			<View style={{flexDirection :  'row'}}>
				<TouchableOpacity
				  style={[styles.button, styles.buttonClose]}
				  onPress={() => setShowSaveModal(false)}>
				  <Text style={styles.textStyle}>No</Text>
				</TouchableOpacity>
				<Text>   </Text>
				<TouchableOpacity
				  style={[styles.button, styles.buttonClose]}
				  onPress={() => saveTrackAndClose()}>
				  <Text style={styles.textStyle}>Save</Text>
				</TouchableOpacity>
			</View>
        </View>
      </Modal>
    </View>
  );
};
