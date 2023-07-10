import React from 'react';
import {
    StyleSheet,
} from 'react-native';

export default styles = StyleSheet.create({
   container             : {
      padding            : 10,
      fontFamily         : 'PTSans-Regular',
    },
   title                 : {
      fontFamily         : 'PTSans-Bold',
      fontSize           : 36,
   },
   titleMed              : {
      fontFamily         : 'PTSans-Bold',
      fontSize           : 24,
   },
   textSmall             : {
      fontFamily         : 'PTSans-Regular',
      fontSize           : 10,
   },
   textBoldSmall         : {
      fontFamily         : 'PTSans-Bold',
      fontSize           : 10,
   },
   textBoldMed           : {
      fontFamily         : 'PTSans-Bold',
      fontSize           : 24,
   },
   settingsContainer     : {
      marginTop          : '33%',
      flex               : 1,
      justifyContent     : 'space-around',
      alignItems         : 'center',
      flexDirection      : 'row',
   },
   settingsSave          : {
      marginTop          : '33%',
   },
   mainPageContainer     : {
      borderWidth        : 1,
      borderRadius       : 5,
      borderColor        : "#d018ec",
      marginTop          : 10,
      marginBottom       : 10,
      paddingTop         : 10,
      paddingBottom      : 10,
      paddingLeft        : 10,
      paddingRight       : 10,
   },
   historyScrollView     : {
      marginTop          : 10,
      marginBottom       : 20,
   },
   fontAwesomeIcon       : {
      alignSelf          : 'center',
   },
   spaceEvenly           : {
      flexDirection      : "row",
      justifyContent     : "space-evenly",
      alignItems         : 'center',
   },
   spaceBetween          : {
      flexDirection      : "row",
      justifyContent     : "space-between",
      alignItems         : 'center',
    },
    mauveBox             : {
      marginTop          : 7,
      marginBottom       : 7,
      padding            : 5,
      borderWidth        : 1,
      borderRadius       : 4,
      borderColor        : '#d018ec',
    },
    button               : {
      alignItems         : 'center',
      justifyContent     : 'center',
      paddingVertical    : 12,
      paddingHorizontal  : 32,
      borderRadius       : 7,
      elevation          : 3,
      backgroundColor    : '#d018ec',
    },
    buttonInactive       : {
      alignItems         : 'center',
      justifyContent     : 'center',
      paddingVertical    : 12,
      paddingHorizontal  : 32,
      borderRadius       : 7,
      elevation          : 3,
      backgroundColor    : '#d018ec',
      opacity            : 0.5,
   },
   buttonText            : {
      fontSize           : 16,
      lineHeight         : 21,
      letterSpacing      : 0.25,
      color              : 'white',
      fontFamily         : 'PTSans-Regular',
   },
   centeredView          : {
      flex               : 1,
      justifyContent     : 'center',
      alignItems         : 'center',
      marginTop          : 22,
      marginBottom       : 22,
   },
   modalView             : {
      margin             : 10,
      backgroundColor    : 'white',
      borderRadius       : 20,
      padding            : 35,
      alignItems         : 'center',
      shadowColor        : '#000',
      shadowOffset       : {
         width           : 0,
         height          : 2,
      },
      shadowOpacity      : 0.25,
      shadowRadius       : 4,
      elevation          : 5,
      fontFamily         : 'PTSans-Regular',
   },
   buttonClose           : {
      backgroundColor    : '#d018ec',
      fontFamily         : 'PTSans-Regular',
   },
   textStyle             : {
      color              : 'white',
      textAlign          : 'center',
      fontFamily         : 'PTSans-Bold',
   },
   modalText             : {
      marginBottom       : 15,
      textAlign          : 'center',
      fontFamily         : 'PTSans-Regular',
   },
   modalHeader           : {
      marginBottom       : 15,
      textAlign          : 'center',
      fontFamily         : 'PTSans-Regular',
   },
   centre                : {
      alignItems         : 'center',
   },
   medText               : {
      fontSize           : 16,
      fontFamily         : 'PTSans-Regular',
   },
   bigText               : {
      fontSize           : 24,
      fontFamily         : 'PTSans-Regular',
   },
   permsText             : {
      fontSize           : 12,
      fontFamily         : 'PTSans-Regular',
      marginTop          : 5,
      marginBottom       : 5,
   },
   logoImage             : {
      width              : 35,
      height             : 35,
   },
   textInput             : {
      height             : 40,
      width              : "100%",
      margin             : 12,
      borderWidth        : 1,
      borderColor        : '#d018ec',
      padding            : 10,
   },
   historyContainer      : {
      flex               : 1,
      flexDirection      : 'row',
      borderWidth        : 1,
      borderRadius       : 5,
      borderColor        : "#d018ec",
      padding            : 5,
   },
   historyTrackBar       : {
      flex               : 1,
      alignSelf          : 'baseline',
   },
});
