/*
Copyright 2019-2022 (c) Dappros Ltd, registered in England & Wales, registration number 11455432. All rights reserved.
You may not use this file except in compliance with the License.
You may obtain a copy of the License at https://github.com/dappros/ethora/blob/main/LICENSE.
Note: linked open-source libraries and components may be subject to their own licenses.
*/

import PropTypes from 'prop-types';
import React, {createRef, useEffect, useState} from 'react';
import {
  Clipboard,
  StyleSheet,
  Image,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {colors} from '../../constants/messageColors';
import {
  MessageImage,
  Time,
  utils,
  MessageProps,
} from 'react-native-gifted-chat';
import {coinImagePath, commonColors, textStyles} from '../../../docs/config';
import {QuickReplies} from './QuickReplies';
import {MessageText} from './MessageText';
import { HStack, Text, View } from 'native-base';
import { observer } from 'mobx-react-lite';

const {isSameUser, isSameDay, StylePropType} = utils;

interface BubbleProps {
  onLongPress:any;
  currentMessage:any;
  onTap:any;
  containerStyle?:any;
  wrapperStyle?:any;
  messageTextStyle?:any;
  messageTextProps?:any;
  renderMessageText?:any;
  renderMessageImage?:any;
  renderTicks?:any;
  user:any;
  tickStyle?:any;
  renderUsername?:any;
  renderTime?:any;
  position?:any;
  renderCustomView?:any;
  nextMessage?:any;
  containerToNextStyle?:any;
  previousMessage?:any;
  containerToPreviousStyle?:any;
  isCustomViewBottom?:any;
  image?:any;
  bottomContainerStyle?:any;
  touchableProps?:any;
  timeProps?:any;
  usernameProps?:any;
  messageImageProps?:any;
  type:'main'|'thread';
  scrollToParentMessage:any;
  handleReply:(message:any) => void
}

const Bubble = observer((props:BubbleProps)=> {
  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     initialAnimationValue: new Animated.Value(0),
  //     width: 0,
  //   };
  //   this.onLongPress = this.onLongPress.bind(this);
  //   this.onPressMessage = this.onPressMessage.bind(this);
  // }

  const [initialAnimationValue, setInitialAnimationValue] = useState(new Animated.Value(0));
  const [width, setWidth] = useState(0);

  const {
    onLongPress,
    currentMessage,
    onTap,
    containerStyle,
    wrapperStyle,
    messageTextStyle,
    messageTextProps,
    renderMessageText,
    renderMessageImage,
    renderTicks,
    user,
    tickStyle,
    renderUsername,
    renderTime,
    position,
    renderCustomView,
    nextMessage,
    containerToNextStyle,
    previousMessage,
    containerToPreviousStyle,
    isCustomViewBottom,
    image,
    bottomContainerStyle,
    touchableProps,
    timeProps,
    usernameProps,
    messageImageProps,
    type,
    scrollToParentMessage,
    handleReply
  } = props


  const onLongPressHandle= () =>{
    if (onLongPress) {
      onLongPress(currentMessage);
    }
  }

  const onPressMessage = () => {
    onTap(currentMessage);
  }

  const renderMessageTextHandle = () =>{
    if (currentMessage.text) {
      if (renderMessageText) {
        return renderMessageText(messageTextProps);
      }
      return (
        <MessageText
          {...props}
          textStyle={{
            left: [styles.content.userTextStyleLeft, messageTextStyle],
            right: [styles.content.userTextStyleLeft],
          }}
        />
      );
    }
    return null;
  }

  const renderMessageImageHandle=() =>{
    if (
      currentMessage.image ||
      currentMessage.realImageUrl
    ) {
      if (renderMessageImage) {
        return renderMessageImage(props);
      }
      return (
        <MessageImage
          {...messageImageProps}
          imageStyle={[styles.slackImage, messageImageProps.imageStyle]}
        />
      );
    }
    return null;
  }

  const renderTicksHandle=() =>{
    if (renderTicks) {
      return renderTicks(currentMessage);
    }
    if (currentMessage.user._id !== user._id) {
      return null;
    }
    if (currentMessage.sent || currentMessage.received) {
      return (
        <View style={[styles.headerItem, styles.tickView]}>
          {currentMessage.sent && (
            <Text
              style={[styles.standardFont, styles.tick, tickStyle]}>
              ✓
            </Text>
          )}
          {currentMessage.received && (
            <Text
              style={[styles.standardFont, styles.tick, tickStyle]}>
              ✓
            </Text>
          )}
        </View>
      );
    }
    return null;
  }

  const renderUsernameHandle=() =>{
    const username = currentMessage.user.name;
    if (username) {
      if (renderUsername) {
        return renderUsername(usernameProps);
      }
      return (
        <View
        style={styles.content.usernameView}>
          <Text
          color={"white"}
          fontSize={hp('2%')}
          fontFamily={textStyles.lightFont}
          >
            {username}
          </Text>
        </View>
      );
    }
    return null;
  }

  const renderTimeHandle=() =>{
    if (currentMessage.createdAt) {
      if (renderTime) {
        return renderTime(timeProps);
      }
      return (
        <Time
          {...props}
          containerStyle={{left: [styles.timeContainer]}}
          textStyle={{
            left: [
              styles.standardFont,
              styles.headerItem,
              styles.time,
              timeProps?.textStyle?timeProps.textStyle:null,
            ],
          }}
        />
      );
    }
    return null;
  }

  const renderTokenCount=() => {
    if (currentMessage.tokenAmount) {
      return (
        <View style={[styles[position].tokenContainerStyle]}>
          <Text style={[styles[position].tokenTextStyle]}>
            {currentMessage.tokenAmount}
          </Text>
          <Image
            source={coinImagePath}
            resizeMode={'contain'}
            style={styles[position].tokenIconStyle}
          />
        </View>
      );
    }
  }

  const renderReplyCount = () => {

    const replyConst = currentMessage.numberOfReplies>1?'replies':'reply'
    
    if(currentMessage.numberOfReplies){
      let text = ' reply'
      if(currentMessage.numberOfReplies > 1){
        text = ' replies'
      }
      return(
        <HStack style={styles[position].numberOfRepliesContainerStyle}>
          <TouchableOpacity onPress={()=>handleReply(currentMessage)}>
              <Text
              fontFamily={textStyles.regularFont}
              color={commonColors.primaryColor}
              >
                  {currentMessage.numberOfReplies} {replyConst} (tap to review)
              </Text>
          </TouchableOpacity>
      </HStack>
      )
    }
  }
  const renderQuickReplies=() =>{
    if (currentMessage.quickReplies && width) {
      let quickReplies = [];
      try {
        quickReplies = JSON.parse(currentMessage.quickReplies)
      } catch (error) {
        console.log(error)
      }
      return (
        <QuickReplies
          quickReplies={quickReplies}
          roomJid={currentMessage.roomJid}
          roomName={currentMessage.mucname}
          width={width}
          messageAuthor={currentMessage.user._id.split('@')[0]}
        />
      );
    }
  }

  const renderCustomViewHandle=() =>{
    if (renderCustomView) {
      return renderCustomView(props);
    }
    return null;
  }

  const styledBubbleToNext=() =>{
    if (
      currentMessage &&
      nextMessage &&
      position &&
      isSameUser(currentMessage, nextMessage) &&
      isSameDay(currentMessage, nextMessage)
    ) {
      return [
        styles[position].containerToNext,
        containerToNextStyle && containerToNextStyle[position],
      ];
    }
    return null;
  }

  const styledBubbleToPrevious=() =>{
    if (
      currentMessage &&
      previousMessage &&
      position &&
      isSameUser(currentMessage, previousMessage) &&
      isSameDay(currentMessage, previousMessage)
    ) {
      return [
        styles[position].containerToPrevious,
        containerToPreviousStyle && containerToPreviousStyle[position],
      ];
    }
    return null;
  }

  // need to work
  // renderMessageVideo() {
  //   if (this.props.currentMessage && this.props.currentMessage.video) {
  //       const { containerStyle, wrapperStyle, ...messageVideoProps } = this.props;
  //       if (this.props.renderMessageVideo) {
  //           return this.props.renderMessageVideo(messageVideoProps);
  //       }
  //       return <MessageVideo {...messageVideoProps}/>;
  //   }
  //   return null;
  // }
  // renderMessageAudio() {
  //     if (this.props.currentMessage && this.props.currentMessage.audio) {
  //         const { containerStyle, wrapperStyle, ...messageAudioProps } = this.props;
  //         if (this.props.renderMessageAudio) {
  //             return this.props.renderMessageAudio(messageAudioProps);
  //         }
  //         return <MessageAudio {...messageAudioProps}/>;
  //     }
  //     return null;
  // }

  const renderBubbleContent=() =>{
    return isCustomViewBottom ? (
      <View>
        {renderMessageImageHandle()}
        {/* {this.renderMessageVideo()}
    {this.renderMessageAudio()} */}
        {!currentMessage.image && renderMessageTextHandle()}

        {renderCustomViewHandle()}
      </View>
    ) : (
      <View>
        {renderCustomViewHandle()}
        {renderMessageImageHandle()}
        {/* {this.renderMessageVideo()}
      {this.renderMessageAudio()} */}
        {!currentMessage.image && renderMessageTextHandle()}
      </View>
    );
  }
  
  const setBubbleWidth = (width:any) => {
    setWidth(width)
    // this.widthRef.current = width
  };
    
  const AnimatedStyle = {
    backgroundColor: initialAnimationValue.interpolate({
      inputRange: [0, 100],
      outputRange: [
        position === 'left'
          ? colors.leftBubbleBackground
          : colors.defaultBlue,
        '#F0B310',
      ],
    }),
  };

    const replyComponent = () => {
    return (
    currentMessage.isReply?
    <TouchableOpacity
    onPress={()=>scrollToParentMessage(currentMessage)}
    >
      <HStack
      style={styles[position].replyWrapper}
      borderLeftColor={"green.100"}
      minH={hp('6%')} w="100%" bg={"white"}>
        {/* <Box borderRadius={15} bg={"green.600"} w={wp("0.4%")}>

        </Box> */}
        <View marginLeft={4}>
          <Text
          
          fontSize={hp('1.5%')}
          fontFamily={textStyles.boldFont}
          >{currentMessage.mainMessageUserName?currentMessage.mainMessageUserName:'N/A'}</Text>
          {
            currentMessage.mainMessageImagePreview?
            <Image
            source={{uri:currentMessage.mainMessageImagePreview}}
              style={{
                height:hp("10%"),
                width:hp('10%')
              }}
            />:null
          }
        {!currentMessage.mainMessageImagePreview&&
        <Text
        fontSize={hp('1.5%')}
        fontFamily={textStyles.mediumFont}
        >
          {currentMessage.mainMessageText}
        </Text>
        }
        <Text color={"blue.100"}>
          {currentMessage.showInChannel}
        </Text>
        </View>
      </HStack>
    </TouchableOpacity>:null
    )
  }

  return (
    <View
      onLayout={e => setBubbleWidth(e.nativeEvent.layout.width)}
      style={[
        styles[position].container,
        containerStyle && containerStyle[position],
        {position: 'relative'},
      ]}>
      <Animated.View
        style={[
          styles[position].wrapper,
          styledBubbleToNext(),
          styledBubbleToPrevious(),
          wrapperStyle && wrapperStyle[position],
          AnimatedStyle,
          // {maxWidth: 200}
        ]}>
        {type==='main'? replyComponent():null}
        {!isSameUser(currentMessage, previousMessage)
          ? renderUsernameHandle()
          : null}
        <TouchableWithoutFeedback
          onPress={()=>onPressMessage()}
          onLongPress={()=>onLongPressHandle()}
          accessibilityTraits="text"
          {...props.touchableProps}>
          <View>
            {renderBubbleContent()}
            <View
              style={[
                styles[position].bottom,
                bottomContainerStyle && bottomContainerStyle[position],
              ]}>
              <View
                style={{
                  flexDirection: position === 'left' ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {renderTimeHandle()}
                {renderTicksHandle()}
              </View>
            </View>

            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: position === 'left' ? 0 : null,
                left: position === 'right' ? 0 : null,

                // [position]: 0
              }}>
              {renderTokenCount()}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
      {renderQuickReplies()}
      {renderReplyCount()}
    </View>
  );
})

export default Bubble;

// Note: Everything is forced to be "left" positioned with this component.
// The "right" position is only used in the default Bubble.
const styles = {
  left: StyleSheet.create({
    container: {
      marginTop:2
    },
    replyWrapper:{
      borderTopRightRadius: 15,
      padding:2,
      borderLeftWidth:2,
      borderLeftColor:"green",
      borderWidth:2,
      borderColor:"green",
      borderBottomWidth:0
    },
    wrapper: {
      borderRadius: 15,
      backgroundColor: colors.leftBubbleBackground,
      marginRight: 60,
      minHeight: 20,
      justifyContent: 'flex-end',
      minWidth: 100,
    },
    tokenContainerStyle: {
      flexDirection: 'row',
      marginRight: 10,
      marginBottom: 5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tokenIconStyle: {
      height: hp('2%'),
      width: hp('2%'),
    },
    tokenTextStyle: {
      color: colors.white,
      fontFamily: textStyles.regularFont,
      fontSize: 10,
      fontWeight: 'bold',
      backgroundColor: 'transparent',
      textAlign: 'right',
    },
    numberOfRepliesContainerStyle:{
      flexDirection:'row',
      justifyContent: 'flex-start',
      alignItems: 'center'
    },
    containerToNext: {
      borderBottomLeftRadius: 3,
    },
    containerToPrevious: {
      borderTopLeftRadius: 3,
    },
    bottom: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
  }),
  right: StyleSheet.create({
    container: {
      marginTop:2
    },
    replyWrapper:{
      borderTopLeftRadius: 15,
      padding:2,
      borderLeftWidth:2,
      borderLeftColor:"green",
      borderWidth:2,
      borderColor:"green",
      borderBottomWidth:0
    },
    wrapper: {
      borderRadius: 15,
      backgroundColor: colors.defaultBlue,
      marginLeft: 60,
      minHeight: 20,
      justifyContent: 'flex-end',
      minWidth: 100,
    },
    containerToNext: {
      borderBottomRightRadius: 3,
    },
    tokenContainerStyle: {
      flexDirection: 'row',
      marginLeft: 10,
      marginBottom: 5,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    tokenIconStyle: {
      height: hp('2%'),
      width: hp('2%'),
    },
    tokenTextStyle: {
      color: colors.white,
      fontFamily: textStyles.regularFont,
      fontSize: 10,
      fontWeight: 'bold',
      backgroundColor: 'transparent',
      textAlign: 'right',
    },
    numberOfRepliesContainerStyle:{
      flexDirection:'row',
      justifyContent: 'flex-end',
      alignItems: 'center'
    },
    containerToPrevious: {
      borderTopRightRadius: 3,
    },
    bottom: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
  }),
  content: StyleSheet.create({
    tick: {
      fontFamily: textStyles.regularFont,
      fontSize: 10,
      backgroundColor: colors.backgroundTransparent,
      color: colors.white,
    },
    tickView: {
      flexDirection: 'row',
      marginRight: 10,
    },
    username: {
      top: -3,
      left: 0,
      fontSize: 12,
      backgroundColor: 'transparent',
      color: '#aaa',
    },
    usernameView: {
      flexDirection: 'row',
      marginHorizontal: 10,
    },
    userTextStyleLeft: {
      fontFamily: textStyles.regularFont,
      color: '#FFFF',
    },
  }),
};

Bubble.defaultProps = {
  touchableProps: {},
  onLongPress: null,
  renderMessageImage: null,
  renderMessageVideo: null,
  renderMessageAudio: null,
  renderMessageText: null,
  renderCustomView: null,
  renderUsername: null,
  renderTicks: null,
  renderTime: null,
  renderQuickReplies: null,
  onQuickReply: null,
  position: 'left',
  // optionTitles: DEFAULT_OPTION_TITLES,
  currentMessage: {
    text: null,
    createdAt: null,
    image: null,
  },
  nextMessage: {},
  previousMessage: {},
  containerStyle: {},
  wrapperStyle: {},
  bottomContainerStyle: {},
  tickStyle: {},
  usernameStyle: {},
  containerToNextStyle: {},
  containerToPreviousStyle: {},
};

Bubble.propTypes = {
  user: PropTypes.object.isRequired,
  touchableProps: PropTypes.object,
  onLongPress: PropTypes.func,
  renderMessageImage: PropTypes.func,
  renderMessageVideo: PropTypes.func,
  renderMessageAudio: PropTypes.func,
  renderMessageText: PropTypes.func,
  renderCustomView: PropTypes.func,
  isCustomViewBottom: PropTypes.bool,
  renderUsernameOnMessage: PropTypes.bool,
  renderUsername: PropTypes.func,
  renderTime: PropTypes.func,
  renderTicks: PropTypes.func,
  renderQuickReplies: PropTypes.func,
  onQuickReply: PropTypes.func,
  position: PropTypes.oneOf(['left', 'right']),
  optionTitles: PropTypes.arrayOf(PropTypes.string),
  currentMessage: PropTypes.object,
  nextMessage: PropTypes.object,
  previousMessage: PropTypes.object,
  containerStyle: PropTypes.shape({
    left: StylePropType,
    right: StylePropType,
  }),
  wrapperStyle: PropTypes.shape({
    left: StylePropType,
    right: StylePropType,
  }),
  bottomContainerStyle: PropTypes.shape({
    left: StylePropType,
    right: StylePropType,
  }),
  tickStyle: StylePropType,
  usernameStyle: StylePropType,
  containerToNextStyle: PropTypes.shape({
    left: StylePropType,
    right: StylePropType,
  }),
  containerToPreviousStyle: PropTypes.shape({
    left: StylePropType,
    right: StylePropType,
  }),
};
