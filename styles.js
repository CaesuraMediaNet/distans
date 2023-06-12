import React from 'react';
import {
    StyleSheet,
} from 'react-native';

export default styles = StyleSheet.create({
	typeFace              : {
		fontFamily        : 'PTSans-Regular',
	},
    container             : {
        padding           : 10,
		fontFamily        : 'PTSans-Regular',
    },
    title                 : {
		fontFamily        : 'PTSans-Bold',
        fontSize          : 36,
    },
    distributed           : {
        padding           : 5,
        marginTop         : 7,
        marginBottom      : 7,
        flex              : 1,
        flexDirection     : 'row',
        flexWrap          : 'wrap',
        alignItems        : 'center',
        borderWidth       : 1,
        borderRadius      : 4,
        borderColor       : '#d018ec',
    },
    help                  : {
        position          : "absolute",
        top               : 10,
        right             : 0,
        zIndex            : 1,
    },
    spaceEvenly           : {
        flexDirection     : "row",
        justifyContent    : "space-evenly",
        alignItems        : 'center',
    },
    spaceBetween          : {
        flexDirection     : "row",
        justifyContent    : "space-between",
        alignItems        : 'center',
    },
    greenBox              : {
        marginTop         : 7,
        marginBottom      : 7,
        padding           : 5,
        borderWidth       : 1,
        borderRadius      : 4,
        borderColor       : '#d018ec',
    },
    shadow                : {
        shadowOffset      : {
            width         : 2,
            height        : 1
        },
        shadowColor       : '#d018ec',
        shadowOpacity     : 0.5,
        shadowRadius      : 2,
    },
    button                : {
        alignItems        : 'center',
        justifyContent    : 'center',
        paddingVertical   : 12,
        paddingHorizontal : 32,
        borderRadius      : 7,
        elevation         : 3,
        backgroundColor   : '#d018ec',
    },
    buttonInactive        : {
        alignItems        : 'center',
        justifyContent    : 'center',
        paddingVertical   : 12,
        paddingHorizontal : 32,
        borderRadius      : 7,
        elevation         : 3,
        backgroundColor   : '#d018ec',
		opacity           : 0.5,
    },
    buttonText            : {
        fontSize          : 16,
        lineHeight        : 21,
        letterSpacing     : 0.25,
        color             : 'white',
		fontFamily        : 'PTSans-Regular',
    },
	iconStyle             : {
        color             : 'dimgray',
        padding           : 7,
        alignItems        : 'center',
        margin            : 1,
    },
    selectedStyle         : {
        padding           : 5,
        borderWidth       : 2,
        borderRadius      : 4,
        borderColor       : '#d018ec',
        alignItems        : 'center',
        margin            : 1,
    },
    wonStyle              : {
        color             : 'dimgray',
        padding           : 7,
        opacity           : 0.6,
        alignItems        : 'center',
        margin            : 1,
    },
    instructionP          : {
        marginTop         : 10,
        marginBottom      : 10,
		fontFamily        : 'PTSans-Regular',
    },
    header                : {
        marginTop         : 25,
        fontSize          : 24,
		fontFamily        : 'PTSans-Regular',
    },
    flexible              : {
        flex              : 1,
        flexDirection     : 'row',
        flexWrap          : 'wrap',
    },
	centeredView          : {
		flex              : 1,
		justifyContent    : 'center',
		alignItems        : 'center',
		marginTop         : 22,
		marginBottom      : 22,
	},
	modalView             : {
		margin            : 20,
		backgroundColor   : 'white',
		borderRadius      : 20,
		padding           : 35,
		alignItems        : 'center',
		shadowColor       : '#000',
		shadowOffset      : {
			width         : 0,
			height        : 2,
		},
		shadowOpacity     : 0.25,
		shadowRadius      : 4,
		elevation         : 5,
		fontFamily        : 'PTSans-Regular',
	},
	buttonOpen            : {
		backgroundColor   : '#F194FF',
		fontFamily        : 'PTSans-Regular',
	},
	buttonClose           : {
		backgroundColor   : '#2196F3',
		fontFamily        : 'PTSans-Regular',
	},
	textStyle             : {
		color             : 'white',
		textAlign         : 'center',
		fontFamily        : 'PTSans-Bold',
	},
	modalText             : {
		marginBottom      : 15,
		textAlign         : 'center',
		fontFamily        : 'PTSans-Regular',
	},
	modalHeader           : {
		marginBottom      : 15,
		textAlign         : 'center',
		fontFamily        : 'PTSans-Regular',
	},
	centre                : {
		alignItems        : 'center',
	},
	sectionText           : {
		fontSize          : 18,
		marginTop         : 7,
		fontFamily        : 'PTSans-Regular',
	},
	medText               : {
		fontSize          : 16,
		fontFamily        : 'PTSans-Regular',
	},
	bigText               : {
		fontSize          : 24,
		fontFamily        : 'PTSans-Regular',
	},
	videoContainer        : {
		width             : "100%",
		height            : 425,
	},
	video                 : {
		position          : 'absolute',
		top               : 0,
		left              : 0,
		right             : 0,
		bottom            : 0,
		backgroundColor   : 'white',
		justifyContent    : 'center',
	},
	instructionsHeader    : {
		marginTop         : 10,
	},
	logoImage             : {
		width             : 35,
		height            : 35,
	}
});
