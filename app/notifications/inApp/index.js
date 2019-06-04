import React from 'react';
import {
	View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import { isNotch, isIOS } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_TITLE, HEADER_BACKGROUND } from '../../constants/colors';
import Avatar from '../../containers/Avatar';
import { removeNotification as removeNotificationAction } from '../../actions/notification';
import sharedStyles from '../../views/Styles';

const AVATAR_SIZE = 40;
const ANIMATION_DURATION = 300;
const { width } = Dimensions.get('window');
const MAX_WIDTH_MESSAGE = width - 100;
let timeout;

let TOP = 0;
if (isIOS) {
	TOP = isNotch ? 45 : 20;
}

const styles = StyleSheet.create({
	container: {
		minHeight: 55,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		position: 'absolute',
		zIndex: 2,
		backgroundColor: HEADER_BACKGROUND,
		width: '100%'
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start'
	},
	avatar: {
		marginHorizontal: 10
	},
	roomName: {
		...sharedStyles.textColorTitle
	},
	message: {
		maxWidth: MAX_WIDTH_MESSAGE,
		...sharedStyles.textColorNormal
	},
	close: {
		color: COLOR_TITLE,
		marginHorizontal: 10
	}
});
@connect(
	state => ({
		userId: state.login.user && state.login.user.id,
		baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
		token: state.login.user && state.login.user.token,
		notification: state.notification
	}),
	dispatch => ({
		removeNotification: () => dispatch(removeNotificationAction())
	})
)
export default class NotificationBadge extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		token: PropTypes.string,
		userId: PropTypes.string,
		notification: PropTypes.object,
		removeNotification: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	shouldComponentUpdate(nextProps) {
		const { notification: nextNotification } = nextProps;
		const { notification: { payload }, navigation } = this.props;
		const navState = this.getNavState(navigation.state);
		if (navState && navState.routeName === 'RoomView' && nextNotification.payload && navState.params.rid === nextNotification.payload.rid) {
			return false;
		}
		if (!equal(nextNotification.payload, payload)) {
			return true;
		}
		return false;
	}

	componentDidUpdate() {
		const { notification: { payload } } = this.props;
		if (payload.rid) {
			this.show();
		}
	}

	getNavState = (routes) => {
		if (!routes.routes) {
			return routes;
		}
		return this.getNavState(routes.routes[routes.index]);
	}

	show = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			},
		).start(() => {
			if	(timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(() => {
				this.hide();
			}, 3000);
		});
	}

	hide = () => {
		const { removeNotification } = this.props;
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			},
		).start();
		clearInterval(timeout);
		setTimeout(removeNotification, ANIMATION_DURATION);
	}

	goToRoom = () => {
		const { notification: { payload }, navigation } = this.props;
		const { rid, type, prid } = payload;
		const name = type === 'p' ? payload.name : payload.sender.username;
		const navState = this.getNavState(navigation.state);
		if (navState.routeName === 'RoomView') {
			navigation.push('RoomView', {
				rid, name, t: type, prid
			});
		} else {
			navigation.navigate('RoomView', {
				rid, name, t: type, prid
			});
		}
		this.hide();
	}

	render() {
		const {
			baseUrl, token, userId, notification
		} = this.props;
		const { message, payload } = notification;
		const { type } = payload;
		const name = type === 'p' ? payload.name : payload.sender.username;
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-TOP - 55, TOP]
		});
		return (
			<Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
				<TouchableOpacity style={styles.content} onPress={this.goToRoom}>
					<Avatar text={name} size={AVATAR_SIZE} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} />
					<View>
						<Text style={styles.roomName}>{name}</Text>
						<Text style={styles.message} numberOfLines={1}>{message}</Text>
					</View>
				</TouchableOpacity>
				<TouchableOpacity onPress={this.hide}>
					<CustomIcon name='circle-cross' style={styles.close} size={20} />
				</TouchableOpacity>
			</Animated.View>
		);
	}
}
